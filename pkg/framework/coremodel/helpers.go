package coremodel

import (
	"io/fs"

	"github.com/grafana/thema"
)

type CoremodelDecl struct {
	Lineage     thema.Lineage `json:"lineage"`
	IsCanonical bool          `json:"isCanonical"`
}

func LoadCoremodel(path string, cueFS fs.FS, lib thema.Library, opts ...thema.BindOption) (thema.Lineage, error) {

}
