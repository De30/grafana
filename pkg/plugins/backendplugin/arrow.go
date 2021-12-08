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

// QueryData makes a QueryData request to the connected plugin This does the arrow stuff
func (p *ArrowPlugin) QueryData(ctx context.Context, r *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	p.logger.Info("QueryData called", "request", r)

	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range r.Queries {
		res := p.query(ctx, r.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type flightQuery struct {
	Query         backend.DataQuery     `json:"query"`
	PluginContext backend.PluginContext `json:"context"`
}

func (p *ArrowPlugin) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	response := backend.DataResponse{}
	q := flightQuery{
		Query:         query,
		PluginContext: pCtx,
	}

	payload, err := json.Marshal(&q)
	if err != nil {
		p.logger.Error("flight json.Marshal error", "error", err)
		response.Error = err
		return response
	}
	resp, err := p.client.DoGet(ctx, &flight.Ticket{Ticket: payload})
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
	payload, err := json.Marshal(&req)
	if err != nil {
		return err
	}
	action := flight.Action{
		Type: "resource",
		Body: payload,
	}
	client, err := p.client.DoAction(ctx, &action)
	if err != nil {
		return err
	}

	r, err := client.Recv()
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
	p.logger.Info("connected to flight`")
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
