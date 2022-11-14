package sync

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPathMapping(t *testing.T) {

	fn := GetPathMapper(MapperOpts{
		Mode: ModeRaw,
	})
	require.Equal(t, "heatmap-legacy", fn("panel-heatmap/heatmap-legacy.json"))

	fn = GetPathMapper(MapperOpts{
		Mode:        ModeSlug,
		IncludePath: true,
	})
	require.Equal(t, "panel-heatmap-heatmap-legacy", fn("panel-heatmap/heatmap-legacy.json"))

	fn = GetPathMapper(MapperOpts{
		Mode:        ModeMD5,
		IncludePath: true,
		MaxLength:   12,
	})
	require.Equal(t, "aa332f91754e", fn("panel-heatmap/heatmap-legacy.json"))

	fn = GetPathMapper(MapperOpts{
		Mode:        ModeSHA1,
		IncludePath: true,
		MaxLength:   12,
	})
	require.Equal(t, "1cad7313b8af", fn("panel-heatmap/heatmap-legacy.json"))

	// fn = GetUIDFromPathSlug
	// require.Equal(t, "panel-heatmap-heatmap-legacy", fn("sample", "panel-heatmap/heatmap-legacy.json"))

}
