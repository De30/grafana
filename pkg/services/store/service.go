package store

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/grafana/grafana/pkg/cmd/grafana-cli/logger"
	"github.com/grafana/grafana/pkg/infra/filestorage"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins/backendplugin/pluginextensionv2"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

var grafanaStorageLogger = log.New("grafanaStorageLogger")

const RootPublicStatic = "public-static"

const MaxUploadSize = 1024 * 1024 // 1MB

type StorageService interface {
	registry.BackgroundService

	Storages(ctx context.Context, user *models.SignedInUser) ([]RootStorageMeta, error)

	// List contents.
	List(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.ListRequest) (*pluginextensionv2.ListResponse, error)

	// Read raw entity contents out of the store.
	Read(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error)

	// Write entity.
	Write(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error)

	// Delete entity.
	Delete(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.DeleteRequest) (*pluginextensionv2.DeleteResponse, error)
}

type standardStorageService struct {
	sql  *sqlstore.SQLStore
	tree *nestedTree
}

type Response struct {
	path       string
	statusCode int
	message    string
	fileName   string
	err        bool
}

func ProvideService(sql *sqlstore.SQLStore, features featuremgmt.FeatureToggles, cfg *setting.Cfg) StorageService {
	roots := []storageRuntime{
		newDiskStorage(RootPublicStatic, "Public static files", &StorageLocalDiskConfig{
			Path: cfg.StaticRootPath,
			Roots: []string{
				"/testdata/",
				// "/img/icons/",
				// "/img/bg/",
				"/img/",
				"/gazetteer/",
				"/maps/",
			},
		}).setReadOnly(true).setBuiltin(true),
	}

	if features.IsEnabled(featuremgmt.FlagStorageLocalUpload) {
		storage := filepath.Join(cfg.DataPath, "storage")
		err := os.MkdirAll(storage, 0700)
		if err != nil {
			logger.Error("error", err)
			os.Exit(1)
		}

		upload := filepath.Join(storage, "upload")
		grafanaStorageLogger.Info("inside provide service", "flag", true)
		err = os.MkdirAll(upload, 0700)
		if err != nil {
			logger.Error("error", err)
			os.Exit(1)
		}
		roots = append(roots, newDiskStorage("upload", "Local file upload", &StorageLocalDiskConfig{
			Path: upload,
			Roots: []string{
				"/",
			},
		}).setBuiltin(true))
	}
	s := newStandardStorageService(roots)
	s.sql = sql
	return s
}

func newStandardStorageService(roots []storageRuntime) *standardStorageService {
	res := &nestedTree{
		roots: roots,
	}
	res.init()
	return &standardStorageService{
		tree: res,
	}
}

func (s *standardStorageService) Run(ctx context.Context) error {
	grafanaStorageLogger.Info("storage starting")
	return nil
}

func (s *standardStorageService) Storages(ctx context.Context, user *models.SignedInUser) ([]RootStorageMeta, error) {
	// TODO: permission check based on user and ctx.
	var result []RootStorageMeta
	for _, r := range s.tree.roots {
		result = append(result, r.Meta())
	}
	return result, nil
}

func (s *standardStorageService) List(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.ListRequest) (*pluginextensionv2.ListResponse, error) {
	// TODO: permission check based on user and ctx.
	listResponse, err := s.tree.ListFolder(ctx, request.GrnFilter)
	if err != nil {
		return nil, err
	}
	// TODO: handle nil listResponse.

	var objects []*pluginextensionv2.Object

	for _, f := range listResponse.Files {
		objects = append(objects, &pluginextensionv2.Object{
			Ref: &pluginextensionv2.EntityReference{
				Kind: "file",     // TODO: don't actually have kind here.
				Grn:  f.FullPath, // TODO: construct GRN from full path
			},
			Name:        f.Name,
			Created:     f.FileMetadata.Created.Unix(),
			Updated:     f.FileMetadata.Modified.Unix(),
			ContentType: f.MimeType,
			Size:        f.Size,
		})
	}

	return &pluginextensionv2.ListResponse{
		Objects: objects,
		HasMore: listResponse.HasMore,
	}, nil
}

func (s *standardStorageService) Read(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error) {
	// TODO: permission check based on user and ctx.
	file, err := s.tree.GetFile(ctx, request.Ref.Grn)
	if err != nil {
		return nil, err
	}
	// TODO: check nil file.
	return &pluginextensionv2.GetResponse{
		Code: 0, // TODO: codes.
		Object: &pluginextensionv2.Object{
			Ref:         request.Ref,
			Name:        file.Name,
			ContentType: file.FileMetadata.MimeType,
			Created:     file.FileMetadata.Created.Unix(),  // TODO: decide on time format.
			Updated:     file.FileMetadata.Modified.Unix(), // TODO: decide on time format.
			Size:        file.Size,
			Body:        file.Contents,
		},
	}, nil
}

func (s *standardStorageService) Write(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error) {
	storage, path := s.tree.getRoot(request.Ref.Grn)
	if storage == nil {
		return nil, fmt.Errorf("storage not found")
	}
	// TODO: permissions check here based on ctx and user.
	err := storage.Upsert(ctx, &filestorage.UpsertFileCommand{
		Path:     path,
		Contents: &request.Body,
	})
	if err != nil {
		return nil, err
	}
	return &pluginextensionv2.WriteResponse{
		Code: 0, // TODO: codes.
	}, nil
}

func (s *standardStorageService) Delete(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.DeleteRequest) (*pluginextensionv2.DeleteResponse, error) {
	// TODO: permission check based on user and ctx.
	err := s.tree.Delete(ctx, request.Ref.Grn)
	if err != nil {
		return nil, err
	}
	// TODO: check nil file.
	return &pluginextensionv2.DeleteResponse{
		Code: 0, // TODO: codes.
	}, nil
}
