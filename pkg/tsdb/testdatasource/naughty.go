package testdatasource

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/minimaxir/big-list-of-naughty-strings/naughtystrings"
)

func (s *Service) handleNaughtyScenario(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	resp := backend.NewQueryDataResponse()

	for _, q := range req.Queries {
		var rsp backend.DataResponse
		switch q.QueryType {
		case "wide-name":
			rsp = doNaughtyWide(q)

		case "timeseries":
			rsp = doNaughtyTimeseries(q)

		default:
			rsp = doNaughtyTimeseries(q)
			//rsp = doNaughtyWide(q)
		}

		resp.Responses[q.RefID] = rsp
	}

	return resp, nil
}

func doNaughtyWide(query backend.DataQuery) backend.DataResponse {
	// <script>alert(document.domain)</script>

	// svg with alert
	// data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHZlcnNpb249IjEuMSIgYmFzZVByb2ZpbGU9ImZ1bGwiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgIDxwb2x5Z29uIGlkPSJ0cmlhbmdsZSIgcG9pbnRzPSIwLDAgMCw1MCA1MCwwIiBmaWxsPSIjMDA5OTAwIiBzdHJva2U9IiMwMDQ0MDAiLz4KICAgPHNjcmlwdCB0eXBlPSJ0ZXh0L2phdmFzY3JpcHQiPgogICAgICBhbGVydChkb2N1bWVudC5sb2NhdGlvbik7CiAgIDwvc2NyaXB0Pgo8L3N2Zz4K

	frame := data.NewFrame("")
	for i, v := range naughtystrings.Unencoded() {
		frame.Fields = append(frame.Fields, data.NewField(v, nil, []int64{int64(i)}))
	}
	return backend.DataResponse{
		Frames: data.Frames{frame},
	}
}

func doNaughtyTimeseries(query backend.DataQuery) backend.DataResponse {
	vals := naughtystrings.Unencoded()
	time := data.NewFieldFromFieldType(data.FieldTypeTime, len(vals))
	time.Name = "time"
	index := data.NewFieldFromFieldType(data.FieldTypeInt64, len(vals))
	index.Name = "count"

	tv := query.TimeRange.From
	for i := range vals {
		tv = tv.Add(query.Interval)
		time.Set(i, tv)
		index.Set(i, int64(i))
	}

	frame := data.NewFrame("",
		time, index, data.NewField("naughty", nil, naughtystrings.Unencoded()),
	)
	return backend.DataResponse{
		Frames: data.Frames{frame},
	}
}
