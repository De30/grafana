package plugins

import (
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	anypb "google.golang.org/protobuf/types/known/anypb"
)

func (r *RoleRegistration) toRoleRegistration() ac.RoleRegistration {
	registration := ac.RoleRegistration{
		Role:   r.Role.toRole(),
		Grants: r.Grants,
	}

	return registration
}

func (r *Role) toRole() ac.RoleDTO {
	role := ac.RoleDTO{
		Version:     r.GetVersion(),
		UID:         r.GetUid(),
		Name:        r.GetName(),
		DisplayName: r.GetDisplayName(),
		Description: r.GetDescription(),
		Group:       r.GetGroup(),
		Permissions: permissions(r.GetPermissions()).toPermissions(),
		Hidden:      r.GetHidden(),
		OrgID:       ac.GlobalOrgID,
	}
	return role
}

type permissions []*Permission

func (p permissions) toPermissions() []ac.Permission {
	permissions := make([]ac.Permission, len(p))
	for i := range p {
		permissions[i] = p[i].toPermission()
	}
	return permissions
}

func (p *Permission) toPermission() ac.Permission {
	return ac.Permission{
		Action: p.Action,
		Scope:  p.Scope,
	}
}

func toEvaluator(ev *anypb.Any) (ac.Evaluator, error) {
	if ev == nil {
		return nil, &noEvaluatorProvided{}
	}

	switch {
	case ev.MessageIs(&PermissionEvaluator{}):
		perm := &PermissionEvaluator{}
		if err := ev.UnmarshalTo(perm); err != nil {
			return nil, err
		}
		if perm.GetAction() == "" {
			return nil, &actionRequiredError{}
		}
		return ac.EvalPermission(perm.GetAction(), perm.Scope...), nil
	case ev.MessageIs(&AnyEvaluator{}):
		any := &AnyEvaluator{}
		if err := ev.UnmarshalTo(any); err != nil {
			return nil, err
		}
		if len(any.AnyOf) == 0 {
			return nil, &actionRequiredError{}
		}
		anyOf := []ac.Evaluator{}
		for _, a := range any.AnyOf {
			acA, err := toEvaluator(a)
			if err != nil {
				return nil, err
			}
			anyOf = append(anyOf, acA)
		}
		return ac.EvalAny(anyOf...), nil
	case ev.MessageIs(&AllEvaluator{}):
		all := &AllEvaluator{}
		if err := ev.UnmarshalTo(all); err != nil {
			return nil, err
		}
		if len(all.AllOf) == 0 {
			return nil, &actionRequiredError{}
		}
		allOf := []ac.Evaluator{}
		for _, a := range all.AllOf {
			acA, err := toEvaluator(a)
			if err != nil {
				return nil, err
			}
			allOf = append(allOf, acA)
		}
		return ac.EvalAll(allOf...), nil
	default:
		return nil, &unknownEvaluator{}
	}
}

func (e *Evaluator) toEvaluator() (ac.Evaluator, error) {
	if e.Ev == nil {
		return nil, &noEvaluatorProvided{}
	}

	return toEvaluator(e.Ev)
}

// TODO test this is enough
func (u *User) toSignedInUser() *models.SignedInUser {
	return &models.SignedInUser{
		UserId: u.ID,
		OrgId:  u.OrgID,
	}
}
