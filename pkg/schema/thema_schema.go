package schema

import (
	"github.com/grafana/thema"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// ThemaSchema contains a Grafana schema where the canonical schema expression is made with Thema and CUE.
//
// TODO: figure out what fields should be here
type ThemaSchema struct {
	lineage           thema.Lineage
	groupName         string
	groupVersion      string
	openapiSchema     apiextensionsv1.JSONSchemaProps
	runtimeObject     runtime.Object
	runtimeListObject runtime.Object
}

// NewThemaSchema returns a new ThemaSchema.
//
// TODO: support multiple versions. Should be possible, since versions are in the lineage.
func NewThemaSchema(
	lineage thema.Lineage,
	groupName, groupVersion string, // TODO: somehow figure this out from the lineage
	openapiSchema apiextensionsv1.JSONSchemaProps, // TODO: should be part of the lineage
	resource, list runtime.Object,
) *ThemaSchema {
	return &ThemaSchema{
		lineage:           lineage,
		groupName:         groupName,
		groupVersion:      groupVersion,
		openapiSchema:     openapiSchema,
		runtimeObject:     resource,
		runtimeListObject: list,
	}
}

// Name returns the canonical string that identifies the object being schematized.
func (ts ThemaSchema) Name() string {
	return ts.lineage.Name()
}

// GroupName returns the schema group name to be registered in k8s.
func (ts ThemaSchema) GroupName() string {
	return ts.groupName
}

// GroupVersion returns the schema group version to be registered in k8s.
func (ts ThemaSchema) GroupVersion() string {
	return ts.groupVersion
}

// RuntimeObject returns the Kubernetes representation of a schema object.
func (ts ThemaSchema) RuntimeObject() runtime.Object {
	return ts.runtimeObject
}

// RuntimeListObject returns the Kubernetes representation of a list of schema objects.
func (ts ThemaSchema) RuntimeListObject() runtime.Object {
	return ts.runtimeListObject
}

// OpenAPISchema returns the openAPI representation of schema.
func (ts ThemaSchema) OpenAPISchema() apiextensionsv1.JSONSchemaProps {
	return ts.openapiSchema
}
