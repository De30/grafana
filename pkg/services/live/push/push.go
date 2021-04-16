package push

import (
	"context"
	"errors"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/grafana/grafana-live-sdk/telemetry/prometheus"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/services/live"
	"github.com/grafana/grafana/pkg/services/live/convert"
	"github.com/grafana/grafana/pkg/services/live/pushurl"
	"github.com/grafana/grafana/pkg/setting"
)

var (
	logger = log.New("live_push")
)

func init() {
	registry.RegisterServiceWithPriority(&Gateway{}, registry.Low)
}

// Gateway receives data and translates it to Grafana Live publications.
type Gateway struct {
	Cfg         *setting.Cfg      `inject:""`
	GrafanaLive *live.GrafanaLive `inject:""`

	converter           *convert.Converter
	prometheusConverter *prometheus.Converter
}

// Init Gateway.
func (g *Gateway) Init() error {
	logger.Info("Telemetry Gateway initialization")

	if !g.IsEnabled() {
		logger.Debug("Telemetry Gateway not enabled, skipping initialization")
		return nil
	}

	g.converter = convert.NewConverter()

	g.prometheusConverter = prometheus.NewConverter()
	go func() {
		time.Sleep(time.Second)
		stream, err := g.GrafanaLive.ManagedStreamRunner.GetOrCreateStream("prometheus")
		if err != nil {
			logger.Error("Error getting stream", "error", err)
			return
		}
		for {
			time.Sleep(time.Second)
			resp, _ := http.Get(g.Cfg.AppURL + "metrics")
			body, _ := ioutil.ReadAll(resp.Body)
			_ = resp.Body.Close()
			metricFrames, err := g.prometheusConverter.Convert(body)
			if err != nil {
				logger.Error("Error converting metrics to stream", "error", err, "body", string(body))
				continue
			}
			for _, mf := range metricFrames {
				err := stream.Push(mf.Key(), mf.Frame(), true)
				if err != nil {
					logger.Error("Error pushing to stream", "error", err, body, string(body))
					return
				}
			}
		}
	}()
	return nil
}

// Run Gateway.
func (g *Gateway) Run(ctx context.Context) error {
	if !g.IsEnabled() {
		logger.Debug("GrafanaLive feature not enabled, skipping initialization of Telemetry Gateway")
		return nil
	}
	<-ctx.Done()
	return ctx.Err()
}

// IsEnabled returns true if the Grafana Live feature is enabled.
func (g *Gateway) IsEnabled() bool {
	return g.Cfg.IsLiveEnabled() // turn on when Live on for now.
}

func (g *Gateway) Handle(ctx *models.ReqContext) {
	streamID := ctx.Params(":streamId")

	stream, err := g.GrafanaLive.ManagedStreamRunner.GetOrCreateStream(streamID)
	if err != nil {
		logger.Error("Error getting stream", "error", err)
		ctx.Resp.WriteHeader(http.StatusInternalServerError)
		return
	}

	// TODO Grafana 8: decide which formats to use or keep all.
	urlValues := ctx.Req.URL.Query()
	frameFormat := pushurl.FrameFormatFromValues(urlValues)
	stableSchema := pushurl.StableSchemaFromValues(urlValues)

	body, err := ctx.Req.Body().Bytes()
	if err != nil {
		logger.Error("Error reading body", "error", err)
		ctx.Resp.WriteHeader(http.StatusInternalServerError)
		return
	}
	logger.Debug("Live Push request",
		"protocol", "http",
		"streamId", streamID,
		"bodyLength", len(body),
		"stableSchema", stableSchema,
		"frameFormat", frameFormat,
	)

	metricFrames, err := g.converter.Convert(body, frameFormat)
	if err != nil {
		logger.Error("Error converting metrics", "error", err, "frameFormat", frameFormat)
		if errors.Is(err, convert.ErrUnsupportedFrameFormat) {
			ctx.Resp.WriteHeader(http.StatusBadRequest)
		} else {
			ctx.Resp.WriteHeader(http.StatusInternalServerError)
		}
		return
	}

	// TODO -- make sure all packets are combined together!
	// interval = "1s" vs flush_interval = "5s"

	for _, mf := range metricFrames {
		err := stream.Push(mf.Key(), mf.Frame(), stableSchema)
		if err != nil {
			ctx.Resp.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
}
