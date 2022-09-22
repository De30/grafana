package navlinks

import "github.com/grafana/grafana/pkg/api/dtos"

func GetServerAdminNode(children []*dtos.NavLink) *dtos.NavLink {
	url := ""
	if len(children) > 0 {
		url = children[0].Url
	}
	return &dtos.NavLink{
		Text:         "Server admin",
		SubTitle:     "Manage all users and orgs",
		Description:  "Manage server-wide settings and access to resources such as organizations, users, and licenses",
		HideFromTabs: true,
		Id:           "admin",
		Icon:         "shield",
		Url:          url,
		SortWeight:   dtos.WeightAdmin,
		Section:      dtos.NavSectionConfig,
		Children:     children,
	}
}
