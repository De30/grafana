package datasource

import (
	"context"
	"errors"
	"strconv"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

// Store
type Store struct {
	sqlStore *sqlstore.SQLStore
	logger   log.Logger
}

// NewStore
func NewStore(store *sqlstore.SQLStore, logger log.Logger) *Store {
	return &Store{
		sqlStore: store,
		logger:   logger.New("store"),
	}
}

// Get
func (s *Store) Get(ctx context.Context, name types.NamespacedName, into runtime.Object) error {
	cmd := &models.GetDataSourceQuery{
		OrgId: 1, // Hardcode for now
		Name:  name.Name,
	}

	if err := s.sqlStore.GetDataSource(ctx, cmd); err != nil {
		return err
	}

	if err := s.oldToNew(cmd.Result, into); err != nil {
		return err
	}

	return nil
}

// Create
func (s *Store) Create(ctx context.Context, obj runtime.Object) error {
	ds, ok := obj.(*Datasource)
	if !ok {
		return errors.New("error: expected object to be a datasource")
	}

	cmd := &models.AddDataSourceCommand{
		Name:              ds.Name,
		Type:              ds.Spec.Type,
		Access:            models.DsAccess(ds.Spec.Access),
		Url:               ds.Spec.Url,
		Password:          ds.Spec.Password,
		Database:          ds.Spec.Database,
		User:              ds.Spec.User,
		BasicAuth:         ds.Spec.BasicAuth,
		BasicAuthUser:     ds.Spec.BasicAuthUser,
		BasicAuthPassword: ds.Spec.BasicAuthPassword,
		WithCredentials:   ds.Spec.WithCredentials,
		IsDefault:         ds.Spec.IsDefault,
		JsonData:          s.parseJSONData(ds),
		Uid:               string(ds.UID),
		OrgId:             1, // hardcode for now, TODO
	}
	return s.sqlStore.AddDataSource(ctx, cmd)
}

// Update
func (s *Store) Update(ctx context.Context, obj runtime.Object) error {
	ds, ok := obj.(*Datasource)
	if !ok {
		return errors.New("error: expected object to be a datasource")
	}

	rv, err := strconv.Atoi(ds.ResourceVersion)
	if err != nil {
		return err
	}

	cmd := &models.UpdateDataSourceCommand{
		Name:              ds.Name,
		Type:              ds.Spec.Type,
		Access:            models.DsAccess(ds.Spec.Access),
		Url:               ds.Spec.Url,
		Password:          ds.Spec.Password,
		Database:          ds.Spec.Database,
		User:              ds.Spec.User,
		BasicAuth:         ds.Spec.BasicAuth,
		BasicAuthUser:     ds.Spec.BasicAuthUser,
		BasicAuthPassword: ds.Spec.BasicAuthPassword,
		WithCredentials:   ds.Spec.WithCredentials,
		IsDefault:         ds.Spec.IsDefault,
		JsonData:          s.parseJSONData(ds),
		Uid:               string(ds.UID),
		OrgId:             1, // hardcode for now, TODO
		Version:           rv,
	}

	// Note: SQL version returns the modified ds with the version bumped
	// and timestamps set
	return s.sqlStore.UpdateDataSourceByUID(ctx, cmd)
}

// Delete
func (s *Store) Delete(ctx context.Context, name types.NamespacedName) error {
	return s.sqlStore.DeleteDataSource(ctx, &models.DeleteDataSourceCommand{
		Name:  name.Name,
		OrgID: 1, // hardcode for now, TODO
	})
}

// oldToNew doesn't need to be method, but keeps things bundled
func (s *Store) oldToNew(ds *models.DataSource, result runtime.Object) error {
	out, ok := result.(*Datasource)
	if !ok {
		return errors.New("error: expected object to be a datasource")
	}

	jd, err := ds.JsonData.MarshalJSON()
	if err != nil {
		jd = []byte{}
		s.logger.Warn("error marshaling datasource JSON data", err)
	}

	out.UID = types.UID(ds.Uid)
	out.Name = ds.Name
	out.ResourceVersion = strconv.Itoa(ds.Version)
	out.Spec = DatasourceSpec{
		Type:              ds.Type,
		Access:            string(ds.Access),
		Url:               ds.Url,
		Password:          ds.Password,
		Database:          ds.Database,
		User:              ds.User,
		BasicAuth:         ds.BasicAuth,
		BasicAuthUser:     ds.BasicAuthUser,
		BasicAuthPassword: ds.BasicAuthPassword,
		WithCredentials:   ds.WithCredentials,
		IsDefault:         ds.IsDefault,
		JsonData:          string(jd),
	}

	return nil
}

func (s *Store) parseJSONData(ds *Datasource) *simplejson.Json {
	jd := simplejson.New()

	if d := ds.Spec.JsonData; d != "" {
		if err := jd.UnmarshalJSON([]byte(ds.Spec.JsonData)); err != nil {
			s.logger.Warn(
				"error unmarshaling datasource JSON data",
				"error", err,
			)
		}
	}

	return jd
}
