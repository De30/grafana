package accesscontrol

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_ScopePrefix(t *testing.T) {
	tests := []struct {
		name  string
		scope string
		want  string
	}{
		{
			name:  "empty",
			scope: "",
			want:  "",
		},
		{
			name:  "minimal",
			scope: ":",
			want:  ":",
		},
		{
			name:  "datasources",
			scope: "datasources:",
			want:  "datasources:",
		},
		{
			name:  "datasources name",
			scope: "datasources:name:testds",
			want:  "datasources:name:",
		},
		{
			name:  "datasources with colons in name",
			scope: "datasources:name:test:a::ds",
			want:  "datasources:name:",
		},
		{
			name:  "prefix",
			scope: "datasources:name:",
			want:  "datasources:name:",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			prefix := ScopePrefix(tt.scope)

			assert.Equal(t, tt.want, prefix)
		})
	}
}

func TestWildcardsFromPrefixes(t *testing.T) {
	type testCase struct {
		desc     string
		prefixes []string
		expected Wildcards
	}

	tests := []testCase{
		{
			desc:     "should handle no prefixes",
			prefixes: []string{},
			expected: Wildcards{"*"},
		},
		{
			desc:     "should generate wildcards for prefix",
			prefixes: []string{"dashboards:uid"},
			expected: Wildcards{"*", "dashboards:*", "dashboards:uid:*"},
		},
		{
			desc:     "should handle trailing :",
			prefixes: []string{"dashboards:uid:"},
			expected: Wildcards{"*", "dashboards:*", "dashboards:uid:*"},
		},
		{
			desc:     "should handle multiple prefixes",
			prefixes: []string{"dashboards:uid:", "folders:uid"},
			expected: Wildcards{"*", "dashboards:*", "dashboards:uid:*", "folders:*", "folders:uid:*"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			wildcards := WildcardsFromPrefixes(tt.prefixes...)
			assert.Equal(t, tt.expected, wildcards)
		})
	}
}
