package plugins

import (
	"testing"

	"github.com/stretchr/testify/require"
	anypb "google.golang.org/protobuf/types/known/anypb"
)

func (ev *PermissionEvaluator) toAny(t *testing.T) *anypb.Any {
	data := &anypb.Any{}
	err := data.MarshalFrom(ev)
	require.NoError(t, err)
	return data
}

func (ev *AnyEvaluator) toAny(t *testing.T) *anypb.Any {
	data := &anypb.Any{}
	err := data.MarshalFrom(ev)
	require.NoError(t, err)
	return data
}

func (ev *AllEvaluator) toAny(t *testing.T) *anypb.Any {
	data := &anypb.Any{}
	err := data.MarshalFrom(ev)
	require.NoError(t, err)
	return data
}
