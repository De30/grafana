package explorevariables

import (
	"errors"

	"github.com/grafana/grafana/pkg/components/simplejson"
)

var (
	ErrVariableNotFound = errors.New("Explore variable not found")
)

// ExploreVariable is the model for explore variable definitions
type ExploreVariable struct {
	ID        int64  `xorm:"pk autoincr 'id'"`
	UID       string `xorm:"uid"`
	OrgID     int64  `xorm:"org_id"`
	CreatedBy int64
	CreatedAt int64
	Label     string
	Name      string
	Desc      string
	Values    *simplejson.Json
}

type ExploreVariableDTO struct {
	UID       string           `json:"uid" xorm:"uid"`
	CreatedBy int64            `json:"createdBy"`
	CreatedAt int64            `json:"createdAt"`
	Label     string           `json:"label"`
	Name      string           `json:"name"`
	Desc      string           `json:"desc"`
	Values    *simplejson.Json `json:"values"`
}

// ExploreVariableResponse is a response struct for ExploreVariableDTO
type ExploreVariableResponse struct {
	Result ExploreVariableDTO `json:"result"`
}

type SearchInExploreVariableQuery struct {
	SearchString string `json:"searchString"`
	Sort         string `json:"sort"`
	Page         int    `json:"page"`
	Limit        int    `json:"limit"`
	From         int64  `json:"from"`
	To           int64  `json:"to"`
}

type ExploreVariableSearchResult struct {
	TotalCount      int                  `json:"totalCount"`
	ExploreVariable []ExploreVariableDTO `json:"exploreVariables"`
	Page            int                  `json:"page"`
	PerPage         int                  `json:"perPage"`
}

type ExploreVariableSearchResponse struct {
	Result ExploreVariableSearchResult `json:"result"`
}

// ExploreVariableDeleteVariableResponse is the response struct for deleting a variable from explore variable
type ExploreVariableDeleteVariableResponse struct {
	ID      int64  `json:"id"`
	Message string `json:"message"`
}

// CreateVariableInExploreVariableCommand is the command for adding explore variable
// swagger:model
type CreateVariableInExploreVariableCommand struct {
	// Name of the variable
	// required: true
	Name  string `json:"name"`
	Label string `json:"label"`
	Desc  string `json:"desc"`
	// The JSON model of values.
	// required: true
	Values *simplejson.Json `json:"values"`
}

// PatchVariableInExploreVariableCommand is the command for updating variable properties
// swagger:model
type PatchVariableInExploreVariableCommand struct {
	Label  string           `json:"label"`
	Name   string           `json:"name"`
	Desc   string           `json:"desc"`
	Values *simplejson.Json `json:"values"`
}
