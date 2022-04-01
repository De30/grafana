package accesscontrol

import (
	"context"

	"github.com/grafana/grafana/pkg/models"

	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/infra/log"
)

type Resolvers struct {
	log                log.Logger
	cache              *localcache.CacheService
	keywordResolvers   map[string]KeywordScopeResolveFunc
	attributeResolvers map[string]ScopeAttributeResolver
}

type ScopeAttributeResolverFunc func(ctx context.Context, orgID int64, scope string) ([]string, error)

func (f ScopeAttributeResolverFunc) Resolve(ctx context.Context, orgID int64, scope string) ([]string, error) {
	return f(ctx, orgID, scope)
}

type ScopeAttributeResolver interface {
	Resolve(ctx context.Context, orgID int64, scope string) ([]string, error)
}

type ScopeKeywordResolverFunc func(ctx context.Context, user *models.SignedInUser) ([]string, error)

func (f ScopeKeywordResolverFunc) Resolve(ctx context.Context, user *models.SignedInUser) ([]string, error) {
	return f(ctx, user)
}

type ScopeKeywordResolver interface {
	Resolve(ctx context.Context, user *models.SignedInUser) ([]string, error)
}
