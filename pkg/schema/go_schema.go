package schema

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// GoSchema contains a Grafana schema
// where the canonical schema expression is made with Go types,
// in traditional Kubernetes style.
//
// TODO figure out what fields should be here
type GoSchema struct {
	objectName        string
	groupName         string
	groupVersion      string
	openapiSchema     apiextensionsv1.JSONSchemaProps
	runtimeObject     runtime.Object
	runtimeListObject runtime.Object
}

// NewGoSchema returns a new GoSchema.
//
// TODO: support multiple versions.
func NewGoSchema(
	objectKind, groupName, groupVersion string,
	openapiSchema apiextensionsv1.JSONSchemaProps,
	resource, list runtime.Object,
) GoSchema {
	return GoSchema{
		objectName:        objectKind,
		groupName:         groupName,
		groupVersion:      groupVersion,
		openapiSchema:     openapiSchema,
		runtimeObject:     resource,
		runtimeListObject: list,
	}
}

// Name returns the canonical string that identifies the object being schematized.
func (gs GoSchema) Name() string {
	return gs.objectName
}

// GroupName returns the schema group name to be registered in k8s.
func (gs GoSchema) GroupName() string {
	return gs.groupName
}

// GroupVersion returns the schema group version to be registered in k8s.
func (gs GoSchema) GroupVersion() string {
	return gs.groupVersion
}

// RuntimeObject returns the Kubernetes representation of a schema object.
func (gs GoSchema) RuntimeObject() runtime.Object {
	return gs.runtimeObject
}

// RuntimeListObject returns the Kubernetes representation of a list of schema objects.
func (gs GoSchema) RuntimeListObject() runtime.Object {
	return gs.runtimeListObject
}

// OpenAPISchema returns the openAPI representation of schema.
func (gs GoSchema) OpenAPISchema() apiextensionsv1.JSONSchemaProps {
	return gs.openapiSchema
}
