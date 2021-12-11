package backendplugin

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/apache/arrow/go/arrow/flight"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/infra/log"

	"google.golang.org/grpc"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type ArrowPlugin struct {
	mu       sync.Mutex
	exited   bool
	pluginId string
	addr     string
	logger   log.Logger
	client   flight.Client
	shutdown ShutdownFunc
}

func NewArrowPlugin(pluginId string, l log.Logger) (*ArrowPlugin, error) {
	plugin := &ArrowPlugin{
		pluginId: pluginId,
		logger:   l,
	}

	return plugin, nil
}

type flightQuery struct {
	Query         backend.DataQuery     `json:"query"`
	PluginContext backend.PluginContext `json:"context"`
}

func (p *ArrowPlugin) mergeFrames(a *data.Frame, b *data.Frame) *data.Frame {
	if a.Name != b.Name {
		p.logger.Error("frame merge error: names do not match", "a", a.Name, "b", b.Name)
		return a
	}

	if len(a.Fields) != len(b.Fields) {
		p.logger.Error("frame merge error: field lengths do not match", "a", len(a.Fields), "b", len(b.Fields))
		return a
	}

	for i := 0; i < b.Rows(); i++ {
		a.AppendRow(b.RowCopy(i)...)
	}

	return a
}

type partitionedResponse struct {
	RefID  string
	Frames []*data.Frame
	Error  error
}

// QueryData makes a QueryData request to the connected plugin This does the arrow stuff
func (p *ArrowPlugin) QueryData(ctx context.Context, r *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	payload, err := json.Marshal(&r)
	if err != nil {
		return nil, err
	}

	info, err := p.client.GetFlightInfo(ctx, &flight.FlightDescriptor{Type: flight.FlightDescriptor_CMD, Cmd: payload})
	if err != nil {
		return nil, err
	}

	var responses_mu sync.Mutex
	var wg sync.WaitGroup
	responses := make([]partitionedResponse, len(info.Endpoint))

	p.logger.Info("endpoints", "e", len(info.Endpoint))
	for i, f := range info.Endpoint {
		wg.Add(1)
		go (func(i int, fe *flight.FlightEndpoint) {
			var q flightQuery
			if err := json.Unmarshal(fe.Ticket.Ticket, &q); err != nil {
				return
			}
			res := p.query(ctx, r.PluginContext, fe)
			responses_mu.Lock()
			p.logger.Info("Set partitionedResponse", "i", i, "len", len(res.Frames))
			responses[i] = partitionedResponse{
				RefID:  q.Query.RefID,
				Frames: res.Frames,
				Error:  res.Error,
			}
			responses_mu.Unlock()
			wg.Done()

		})(i, f)
	}

	wg.Wait()

	merged := make(map[string][]*data.Frame)
	for i, r := range responses {
		if r.Error != nil {
			p.logger.Error("Response error", "refID", r.RefID, "i", i, "err", r.Error)
			continue

		}
		p.logger.Info("Response", "refID", r.RefID, "i", i)
		if len(merged[r.RefID]) == 0 {
			p.logger.Info("refID init", "i", i, "refID", r.RefID, "len", len(r.Frames))
			merged[r.RefID] = r.Frames
			continue
		}
		if len(merged[r.RefID]) != len(r.Frames) {
			p.logger.Error("response merge error: frame lengths do not match", "i", i, "existing", len(merged[r.RefID]), "res", len(r.Frames))
			continue
		}
		for i, a := range merged[r.RefID] {
			merged[r.RefID][i] = p.mergeFrames(a, r.Frames[i])
		}
	}

	for refID, r := range merged {
		response.Responses[refID] = backend.DataResponse{
			Frames: r,
			Error:  nil,
		}
	}

	return response, nil
}

func (p *ArrowPlugin) query(ctx context.Context, pCtx backend.PluginContext, e *flight.FlightEndpoint) backend.DataResponse {
	response := backend.DataResponse{}
	client, err := flight.NewFlightClient(e.Location[0].GetUri(), nil, grpc.WithInsecure())
	if err != nil {
		response.Error = err
		return response
	}
	resp, err := client.DoGet(ctx, e.Ticket)
	if err != nil {
		p.logger.Error("flight DoGet error", "error", err)
		response.Error = err
		return response
	}

	r, err := flight.NewRecordReader(resp)
	if err != nil {
		response.Error = err
		return response
	}
	defer r.Release()

	for r.Next() {
		r.Schema()
		rb := r.Record()
		frame, err := data.FromArrowRecord(rb)
		if err != nil {
			response.Error = err
			rb.Release()
			return response
		}
		response.Frames = append(response.Frames, frame)
		rb.Release()
	}

	if r.Err() != nil {
		response.Error = r.Err()
		return response
	}

	return response
}

// CheckHealth makes a CheckHealth request to the connected plugin
func (p *ArrowPlugin) CheckHealth(ctx context.Context, r *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	p.logger.Info("CheckHealth called", "request", r)

	var status = backend.HealthStatusOk
	var message = "Data source is working"

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

// CallResource makes a CallResource request to the connected plugin
func (p *ArrowPlugin) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	client, err := flight.NewFlightClient("127.0.0.1:5002", nil, grpc.WithInsecure())
	if err != nil {
		return err
	}
	payload, err := json.Marshal(&req)
	if err != nil {
		return err
	}
	action := flight.Action{
		Type: "resource",
		Body: payload,
	}
	c, err := client.DoAction(ctx, &action)
	if err != nil {
		return err
	}

	r, err := c.Recv()
	if err != nil {
		return err
	}
	var res backend.CallResourceResponse
	if err = json.Unmarshal(r.Body, &res); err != nil {
		return err
	}

	return sender.Send(&res)
}

func (p *ArrowPlugin) Start(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.logger.Error("Starting plugin")
	client, err := flight.NewFlightClient("127.0.0.1:5000", nil, grpc.WithInsecure())
	p.logger.Info("connected to flight")
	if err != nil {
		return err
	}
	p.logger.Error("plugin started")

	p.shutdown = func() { client.Close() }
	p.client = client
	p.exited = false

	return nil
}

func (p *ArrowPlugin) Stop(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.shutdown != nil {
		p.shutdown()
		p.exited = true
	}
	return nil
}

func (p *ArrowPlugin) CollectMetrics(ctx context.Context) (*backend.CollectMetricsResult, error) {
	return nil, ErrMethodNotImplemented
}

func (p *ArrowPlugin) SubscribeStream(ctx context.Context, request *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return nil, ErrMethodNotImplemented
}

func (p *ArrowPlugin) PublishStream(ctx context.Context, request *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return nil, ErrMethodNotImplemented
}

func (p *ArrowPlugin) RunStream(ctx context.Context, request *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return ErrMethodNotImplemented
}

func (p *ArrowPlugin) PluginID() string {
	return p.pluginId
}

func (p *ArrowPlugin) Logger() log.Logger {
	return p.logger
}

func (p *ArrowPlugin) Exited() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.exited
}

func (p *ArrowPlugin) IsManaged() bool {
	return true
}

func (p *ArrowPlugin) Decommission() error {
	return nil
}

func (p *ArrowPlugin) IsDecommissioned() bool {
	return false
}
