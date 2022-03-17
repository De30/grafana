package components

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/schema"
)

var (
	// ErrModelAlreadyRegistered is returned when trying to register duplicate model to Registry.
	ErrModelAlreadyRegistered = errors.New("error registering duplicate model")

	// ErrInvalidModelFactory is returned when a dynamically registered model is invalid.
	ErrInvalidModelFactory = errors.New("")
)

var (
	// Used for registering models during initialisation.
	initreg sync.Map = sync.Map{}

	// The guard preventing registering new models after it's loaded.
	initregguard int32 = 0
)

// SchemaOpts
type SchemaOpts struct {
	Type      schema.SchemaType
	ThemaOpts schema.ThemaLoaderOpts
	GoOpts    schema.GoLoaderOpts
}

// CoremodelFactory
type CoremodelFactory func(s schema.ObjectSchema, l log.Logger) Coremodel

// RegisterCoremodel
func RegisterCoremodel(opts SchemaOpts, fn CoremodelFactory) {
	if !atomic.CompareAndSwapInt32(&initregguard, 0, 0) {
		panic("Post-init coremodel registration attempt detected")
	}

	if _, ok := initreg.Load(opts); ok {
		panic("Duplicate coremodel registration attempt detected")
	}

	fmt.Println("regging model", opts, fn)

	initreg.Store(opts, fn)
}

// ProvideReadonlyRegistry
func ProvideReadonlyRegistry(load SchemaLoader) (*Registry, error) {
	atomic.CompareAndSwapInt32(&initregguard, 0, 1)

	var (
		mod []Coremodel = make([]Coremodel, 0, 32)
		log log.Logger  = log.New("components")
		ler error       = nil
	)

	initreg.Range(func(key, value interface{}) bool {
		fmt.Println("iterating initreg", key, value)

		o, ok := key.(SchemaOpts)
		if !ok {
			ler = ErrInvalidModelFactory
			return false
		}

		f, ok := value.(CoremodelFactory)
		if !ok {
			ler = ErrInvalidModelFactory
			return false
		}

		s, err := load.LoadSchema(context.TODO(), o.Type, o.ThemaOpts, o.GoOpts)
		if err != nil {
			ler = err
			return false
		}

		mod = append(mod, f(s, log))
		return true
	})

	if ler != nil {
		return nil, ler
	}

	fmt.Println("readonly registry models", mod)

	return NewRegistry(mod...)
}

// Registry is a registry of coremodels.
type Registry struct {
	lock     sync.RWMutex
	models   []Coremodel
	modelIdx map[registryKey]Coremodel
}

// NewRegistry returns a new Registry with models.
func NewRegistry(models ...Coremodel) (*Registry, error) {
	size := len(models)

	r := &Registry{
		models:   make([]Coremodel, 0, size),
		modelIdx: make(map[registryKey]Coremodel, size),
	}

	if err := r.addModels(models); err != nil {
		return nil, err
	}

	return r, nil
}

// Register adds models to the Registry.
func (r *Registry) Register(models ...Coremodel) error {
	return r.addModels(models)
}

// List returns all coremodels registered in this Registry.
func (r *Registry) List() []Coremodel {
	r.lock.RLock()
	defer r.lock.RUnlock()

	return r.models
}

func (r *Registry) addModels(models []Coremodel) error {
	r.lock.Lock()
	defer r.lock.Unlock()

	// Update model index and return an error if trying to register a duplicate.
	for _, m := range models {
		k := makeRegistryKey(m.Schema())

		if _, ok := r.modelIdx[k]; ok {
			return ErrModelAlreadyRegistered
		}

		r.modelIdx[k] = m
	}

	// Remake model list.
	// TODO: this can be more performant (proper resizing, maybe single loop with index building, etc.).
	r.models = r.models[:0]
	for _, m := range r.modelIdx {
		r.models = append(r.models, m)
	}

	return nil
}

type registryKey struct {
	modelName    string
	groupName    string
	groupVersion string
}

func makeRegistryKey(s schema.ObjectSchema) registryKey {
	return registryKey{
		modelName:    s.Name(),
		groupName:    s.GroupName(),
		groupVersion: s.GroupVersion(),
	}
}
