package snapshotimpl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/services/snapshot"
	"github.com/grafana/grafana/pkg/setting"
	"net/http"
	"time"
)

var logger = log.New("snapshot")

type Service struct {
	Cfg *setting.Cfg

	store             Store
	createExternalURL string
}

func ProvideService(Cfg *setting.Cfg) (Service, error) {
	return Service{
		Cfg: Cfg,
	}, nil
}

func (s *Service) Create(ctx context.Context, cmd *snapshot.CreateCmd) (*snapshot.CreateResult, error) {
	var url string

	err := cmd.Validate()
	if err != nil {
		return nil, err
	}

	if cmd.External {
		if !setting.ExternalEnabled {
			return nil, fmt.Errorf("external dashboard creation is disabled")
		}

		res, err := s.createExternal(ctx, cmd)
		if err != nil {
			return nil, fmt.Errorf("failed to create external snapshot: %w", err)
		}

		url = res.URL
		cmd.Key = res.Key
		cmd.ExternalURL = url
		cmd.DeleteKey = res.DeleteKey
		cmd.ExternalDeleteURL = res.DeleteURL
		cmd.Dashboard = make(map[string]interface{})

		metrics.MApiDashboardSnapshotExternal.Inc()
	} else {
		url = setting.ToAbsUrl("dashboard/snapshot/" + cmd.Key)
		metrics.MApiDashboardSnapshotCreate.Inc()
	}

	model, err := cmd.Skel(time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to create snapshot: %w", err)
	}

	err = s.store.Create(ctx, model)
	if err != nil {
		return nil, fmt.Errorf("failed to save snapshot: %w", err)
	}

	stored, err := s.store.Read(ctx, cmd.Key)
	if err != nil {
		return nil, fmt.Errorf("failed to save snapshot: %w", err)
	}

	return &snapshot.CreateResult{
		Key:       cmd.Key,
		DeleteKey: cmd.DeleteKey,
		URL:       url,
		DeleteURL: setting.ToAbsUrl("api/snapshots-delete/" + cmd.DeleteKey),
		ID:        stored.ID,
	}, nil
}

func (s *Service) Delete(ctx context.Context, cmd *snapshot.DeleteCmd) error {
	key, err := s.store.LookupByDeleteKey(ctx, cmd.DeleteKey)
	if err != nil {
		return err
	}

	stored, err := s.store.Read(ctx, key)
	if err != nil {
		return err
	}

	if stored.External {
		err := s.deleteExternal(ctx, cmd.DeleteKey)
		if err != nil {
			return fmt.Errorf("failed to delete external snapshot: %w", err)
		}
	}

	return s.store.Delete(ctx, cmd.DeleteKey)
}

func (s *Service) GetByKey(ctx context.Context, query *snapshot.GetByKeyQuery) (*snapshot.GetResult, error) {
	if query.DeleteKey != "" {
		key, err := s.store.LookupByDeleteKey(ctx, query.DeleteKey)
		if err != nil {
			return nil, err
		}

		if query.Key != "" && key != query.Key {
			return nil, fmt.Errorf("key and deleteKey do not match")
		}
		query.Key = key
	}

	snap, err := s.store.Read(ctx, query.Key)
	if err != nil {
		return nil, fmt.Errorf("error while loading snapshot: %w", err)
	}

	if query.SignedInUser != nil && query.SignedInUser.UserId != snap.UserID {
		snap.Redact()
	}

	return &snapshot.GetResult{Snapshot: snap}, nil
}

func (s *Service) List(ctx context.Context, query *snapshot.ListQuery) (*snapshot.ListResult, error) {
	//TODO implement me
	panic("implement me")
}

func (s *Service) DeleteExpired(ctx context.Context) (*snapshot.DeleteExpiredResult, error) {
	//TODO implement me
	panic("implement me")
}

type createExternalRequest struct {
	Name      string                 `json:"name"`
	Expires   int64                  `json:"expires"`
	Dashboard map[string]interface{} `json:"dashboard"`
	Key       string                 `json:"key"`
	DeleteKey string                 `json:"deleteKey"`
}

func requestFromCreateCmd(cmd *snapshot.CreateCmd) createExternalRequest {
	return createExternalRequest{
		Name:      cmd.Name,
		Expires:   cmd.Expires,
		Dashboard: cmd.Dashboard,
		Key:       cmd.Key,
		DeleteKey: cmd.DeleteKey,
	}
}

type createExternalResponse struct {
	Key       string `json:"key"`
	DeleteKey string `json:"deleteKey"`
	URL       string `json:"url"`
	DeleteURL string `json:"deleteUrl"`
}

var client = &http.Client{
	Timeout:   5 * time.Second,
	Transport: &http.Transport{Proxy: http.ProxyFromEnvironment},
}

func (s *Service) createExternal(ctx context.Context, cmd *snapshot.CreateCmd) (*createExternalResponse, error) {
	message := requestFromCreateCmd(cmd)

	marshaledMsg, err := json.Marshal(message)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		s.createExternalURL,
		bytes.NewBuffer(marshaledMsg),
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	res, err := client.Do(req)
	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Warn("Failed to close response body", "err", err)
		}
	}()

	if res.StatusCode != 200 {
		return nil, fmt.Errorf("create external snapshot response status code %d", res.StatusCode)
	}

	var r createExternalResponse
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		return nil, err
	}

	return &r, nil
}

func (s *Service) deleteExternal(ctx context.Context, deleteURL string) error {
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		deleteURL,
		nil,
	)
	if err != nil {
		return err
	}

	res, err := client.Do(req)
	if err != nil {
		return err
	}

	defer func() {
		if err := res.Body.Close(); err != nil {
			logger.Warn("Failed to close response body", "err", err)
		}
	}()

	switch res.StatusCode {
	case http.StatusOK:
		return nil
	case http.StatusInternalServerError:
		var respJson map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&respJson); err != nil {
			return err
		}

		// Gracefully ignore "snapshot not found" errors as they could
		// have already been removed either via the cleanup script or
		// by request.
		if respJson["message"] == "Failed to get dashboard snapshot" {
			return nil
		}
		fallthrough
	default:
		return fmt.Errorf("unexpected response when deleting external snapshot, status code: %d", res.StatusCode)
	}
}
