package acimpl

import (
	"context"
	"errors"

	"github.com/prometheus/client_golang/prometheus"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

var _ accesscontrol.AccessControl = new(AccessControl)

func ProvideAccessControl(cfg *setting.Cfg) *AccessControl {
	logger := log.New("accesscontrol")
	return &AccessControl{
		cfg, logger, accesscontrol.NewResolvers(logger),
	}
}

type AccessControl struct {
	cfg       *setting.Cfg
	log       log.Logger
	resolvers accesscontrol.Resolvers
}

func (a *AccessControl) Evaluate(ctx context.Context, user *user.SignedInUser, evaluator accesscontrol.Evaluator) (bool, error) {
	timer := prometheus.NewTimer(metrics.MAccessEvaluationsSummary)
	defer timer.ObserveDuration()
	metrics.MAccessEvaluationCount.Inc()

	if !verifyPermissionsSet(user) {
		user.Permissions = make(map[int64]map[string][]string)
	}

	if !verifyPermissions(user) {
		a.log.Warn("no permissions set for user", "userID", user.UserID, "orgID", user.OrgID, "login", user.Login)
		return false, nil
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

func (a *AccessControl) Checker(ctx context.Context, user *user.SignedInUser, action string) func(scopes ...string) bool {
	if !verifyPermissions(user) {
		return func(scopes ...string) bool { return false }
	}

	userScopes, ok := user.Permissions[user.OrgID][action]
	if !ok {
		return func(scopes ...string) bool { return false }
	}

	lookup := make(map[string]bool, len(userScopes)-1)
	for i := range userScopes {
		lookup[userScopes[i]] = true
	}

	var cached bool
	var hasWildcard bool

	return func(scopes ...string) bool {
		if !cached {
			wildcards := wildcardsFromScopes(scopes...)
			for _, w := range wildcards {
				if _, ok := lookup[w]; ok {
					hasWildcard = true
				}
			}
			cached = true
		}

		if hasWildcard {
			return true
		}

		for _, s := range scopes {
			if lookup[s] {
				return true
			}
		}
		return false
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
	return verifyPermissionsSet(u) || u.Permissions[u.OrgID] != nil
}

func wildcardsFromScopes(scopes ...string) accesscontrol.Wildcards {
	prefixes := make([]string, len(scopes))
	for _, scope := range scopes {
		prefixes = append(prefixes, accesscontrol.ScopePrefix(scope))
	}

	return accesscontrol.WildcardsFromPrefixes(prefixes...)
}
