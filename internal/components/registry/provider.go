package registry

import (
	"context"
	"fmt"
	"sync/atomic"

	"github.com/grafana/grafana/internal/components"
	"github.com/grafana/grafana/pkg/infra/log"
)

// ProvideReadonlyRegistry
func ProvideReadonlyRegistry(load components.SchemaLoader) (*Registry, error) {
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
