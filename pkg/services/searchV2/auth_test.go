package searchV2

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractKind(t *testing.T) {
	t.Run("should extract kind and the uid", func(t *testing.T) {
		kind, entityId, err := extractKind("dashboard/abc-uid")
		require.NoError(t, err)
		require.Equal(t, entityKindDashboard, kind)
		require.Equal(t, "abc-uid", entityId)
	})

	t.Run("should retrieve the original kind and entityId", func(t *testing.T) {
		kind := entityKindPanel
		entityId := "ab124512c"
		createdUid := createUid(kind, entityId)

		extractedKind, extractedEntityId, err := extractKind(createdUid)

		require.NoError(t, err)
		require.Equal(t, kind, extractedKind)
		require.Equal(t, entityId, extractedEntityId)
	})
}
