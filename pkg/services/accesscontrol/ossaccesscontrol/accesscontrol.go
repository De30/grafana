package ossaccesscontrol

import (
	"context"
	"errors"
	"strings"

	"github.com/prometheus/client_golang/prometheus"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

var _ accesscontrol.AccessControl = new(AccessControl)

func ProvideAccessControl(cfg *setting.Cfg, service accesscontrol.Service) *AccessControl {
	logger := log.New("accesscontrol")
	return &AccessControl{
		cfg, logger, accesscontrol.NewResolvers(logger), service,
	}
}

type AccessControl struct {
	cfg       *setting.Cfg
	log       log.Logger
	resolvers accesscontrol.Resolvers
	service   accesscontrol.Service
}

func (a *AccessControl) Evaluate(ctx context.Context, user *user.SignedInUser, evaluator accesscontrol.Evaluator) (bool, error) {
	timer := prometheus.NewTimer(metrics.MAccessEvaluationsSummary)
	defer timer.ObserveDuration()
	metrics.MAccessEvaluationCount.Inc()

	if verifyPermissionsSet(user) {
		user.Permissions = map[int64]map[string][]string{}
	}

	if verifyPermissions(user) {
		permissions, err := a.service.GetUserPermissions(ctx, user, accesscontrol.Options{ReloadCache: true})
		if err != nil {
			return false, err
		}
		user.Permissions[user.OrgID] = accesscontrol.GroupScopesByAction(permissions)
	}

	// Test evaluation without scope resolver first, this will prevent 403 for wildcard scopes when resource does not exist
	if evaluator.Evaluate(user.Permissions[user.OrgID]) {
		return true, nil
	}

	resolvedEvaluator, err := evaluator.MutateScopes(ctx, a.resolvers.GetScopeAttributeMutator(user.OrgID))
	if err != nil {
		if errors.Is(err, accesscontrol.ErrResolverNotFound) {
			return false, nil
		}
		return false, err
	}

	return resolvedEvaluator.Evaluate(user.Permissions[user.OrgID]), nil
}

// FIXME: Test reverse lookup
func (a *AccessControl) Metadata(ctx context.Context, user *user.SignedInUser, prefixes ...string) func(resource accesscontrol.Resource) accesscontrol.Metadata {
	if !verifyPermissions(user) {
		return func(resource accesscontrol.Resource) accesscontrol.Metadata {
			return accesscontrol.Metadata{}
		}
	}

	wildcards := accesscontrol.WildcardsFromPrefixes(prefixes...)

	m := map[string]func(scopes ...string) bool{}

OUTER:
	for action, scopes := range user.Permissions[user.OrgID] {
		lookup := map[string]bool{}
		for _, scope := range scopes {
			if wildcards.Contains(scope) {
				m[action] = func(scopes ...string) bool { return true }
				continue OUTER
			}
			for _, prefix := range prefixes {
				if strings.HasPrefix(scope, prefix) {
					lookup[scope] = true
				}
			}
		}
		m[action] = func(scopes ...string) bool {
			for _, s := range scopes {
				if ok := lookup[s]; ok {
					return true
				}
			}
			return false
		}
	}

	return func(resource accesscontrol.Resource) accesscontrol.Metadata {
		metadata := accesscontrol.Metadata{}
		for action, checker := range m {
			if ok := checker(resource.Scopes()...); ok {
				metadata[action] = true
			}
		}
		return metadata
	}
}

func (a *AccessControl) RegisterScopeAttributeResolver(prefix string, resolver accesscontrol.ScopeAttributeResolver) {
	a.resolvers.AddScopeAttributeResolver(prefix, resolver)
}

func (a *AccessControl) IsDisabled() bool {
	return accesscontrol.IsDisabled(a.cfg)
}

func verifyPermissionsSet(u *user.SignedInUser) bool {
	return u.Permissions != nil
}

func verifyPermissions(u *user.SignedInUser) bool {
	if !verifyPermissionsSet(u) {
		return false
	}
	if _, ok := u.Permissions[u.OrgID]; !ok {
		return false
	}
	return true
}
