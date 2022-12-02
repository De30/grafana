package themes

import (
	"github.com/grafana/grafana/pkg/api/routing"
)

type CustomThemeDTO struct {
	UID  string                 `json:"uid"`
	Name string                 `json:"name"`
	Body map[string]interface{} `json:"body"`
}

type Service interface {
	RegisterHTTPRoutes(routing.RouteRegister)
}
