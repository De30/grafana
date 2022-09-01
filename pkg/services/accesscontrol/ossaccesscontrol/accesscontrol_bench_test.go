package ossaccesscontrol

import (
	"context"
	"fmt"
	"testing"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/actest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/assert"
)

func generateBenchmarkData(b *testing.B, resourceCount, permissionPerResource int) (map[string][]string, map[string]bool) {
	b.Helper()

	res := map[string][]string{}
	ids := make(map[string]bool, resourceCount)

	for p := 0; p < permissionPerResource; p++ {
		action := fmt.Sprintf("resources:action%v", p)
		for r := 0; r < resourceCount; r++ {
			scope := fmt.Sprintf("resources:id:%v", r)
			res[action] = append(res[action], scope)
			ids[fmt.Sprintf("%d", r)] = true
		}
	}

	return res, ids
}

func benchGetMetadata(b *testing.B, resourceCount, permissionPerResource int) {
	permissions, ids := generateBenchmarkData(b, resourceCount, permissionPerResource)
	service := actest.FakeService{}
	ac := ProvideAccessControl(setting.NewCfg(), service)

	u := &user.SignedInUser{OrgID: 1, Permissions: map[int64]map[string][]string{
		1: permissions,
	}}
	fn := ac.Metadata(context.Background(), u, "resources:id:")

	b.ResetTimer()
	result := map[string]accesscontrol.Metadata{}
	for n := 0; n < b.N; n++ {
		for id := range ids {
			result[id] = fn(accesscontrol.WrapResourceID("resources:id:", id))
		}
		assert.Len(b, result, resourceCount)
		for _, resourceMetadata := range result {
			assert.Len(b, resourceMetadata, permissionPerResource)
		}
	}
}

// Lots of permissions
func BenchmarkGetResourcesMetadata_10_1000(b *testing.B)   { benchGetMetadata(b, 10, 1000) }   // ~0.0022s/op
func BenchmarkGetResourcesMetadata_10_10000(b *testing.B)  { benchGetMetadata(b, 10, 10000) }  // ~0.019s/op
func BenchmarkGetResourcesMetadata_10_100000(b *testing.B) { benchGetMetadata(b, 10, 100000) } // ~0.25s/op
func BenchmarkGetResourcesMetadata_10_1000000(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping benchmark in short mode")
	}
	benchGetMetadata(b, 10, 1000000)
} // ~5.8s/op

// Lots of resources
func BenchmarkGetResourcesMetadata_1000_10(b *testing.B)   { benchGetMetadata(b, 1000, 10) }   // ~0,0023s/op
func BenchmarkGetResourcesMetadata_10000_10(b *testing.B)  { benchGetMetadata(b, 10000, 10) }  // ~0.022s/op
func BenchmarkGetResourcesMetadata_100000_10(b *testing.B) { benchGetMetadata(b, 100000, 10) } // ~0.26s/op
func BenchmarkGetResourcesMetadata_1000000_10(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping benchmark in short mode")
	}
	benchGetMetadata(b, 1000000, 10)
} // ~4.1s/op
