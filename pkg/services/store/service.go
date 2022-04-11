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

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

var grafanaStorageLogger = log.New("grafanaStorageLogger")

const RootPublicStatic = "public-static"

const MaxUploadSize = 1024 * 1024 // 1MB

type StorageService interface {
	registry.BackgroundService

	// List folder contents.
	List(ctx context.Context, user *models.SignedInUser, path string) (*data.Frame, error)

	// Read raw file contents out of the store.
	Read(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error)

	// Upload file.
	Upload(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error)
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

func (s *standardStorageService) List(ctx context.Context, user *models.SignedInUser, path string) (*data.Frame, error) {
	// apply access control here
	return s.tree.ListFolder(ctx, path)
}

func (s *standardStorageService) Read(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error) {
	// TODO: permission check based on user and ctx.
	fmt.Println(request.Ref.Grn)
	file, err := s.tree.GetFile(ctx, request.Ref.Grn)
	if err != nil {
		return nil, err
	}
	// TODO: check nil file.
	return &pluginextensionv2.GetResponse{
		Code: 0, // TODO: codes.
		Object: &pluginextensionv2.Object{
			Ref:         request.Ref,
			ContentType: file.FileMetadata.MimeType,
			Created:     file.FileMetadata.Created.Unix(),  // TODO: decide on time format.
			Updated:     file.FileMetadata.Modified.Unix(), // TODO: decide on time format.
			Body:        file.Contents,
		},
	}, nil
}

func (s *standardStorageService) Upload(ctx context.Context, user *models.SignedInUser, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error) {
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
