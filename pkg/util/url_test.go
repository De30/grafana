package util

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJoinURLFragments(t *testing.T) {
	t.Parallel()

	tests := []struct {
		description string
		base        string
		path        string
		expected    string
	}{
		{
			description: "RHS is empty",
			base:        "http://localhost:8080",
			path:        "",
			expected:    "http://localhost:8080",
		},
		{
			description: "RHS is empty and LHS has trailing slash",
			base:        "http://localhost:8080/",
			path:        "",
			expected:    "http://localhost:8080/",
		},
		{
			description: "neither has trailing slash",
			base:        "http://localhost:8080",
			path:        "api",
			expected:    "http://localhost:8080/api",
		},
		{
			description: "LHS has trailing slash",
			base:        "http://localhost:8080/",
			path:        "api",
			expected:    "http://localhost:8080/api",
		},
		{
			description: "LHS and RHS has trailing slash",
			base:        "http://localhost:8080/",
			path:        "api/",
			expected:    "http://localhost:8080/api/",
		},
		{
			description: "LHS has trailing slash and RHS has preceding slash",
			base:        "http://localhost:8080/",
			path:        "/api/",
			expected:    "http://localhost:8080/api/",
		},
	}
	for _, testcase := range tests {
		t.Run("where "+testcase.description, func(t *testing.T) {
			assert.Equalf(
				t,
				testcase.expected,
				JoinURLFragments(testcase.base, testcase.path),
				"base: '%s', path: '%s'",
				testcase.base,
				testcase.path,
			)
		})
	}
}

func TestNewURLQueryReader(t *testing.T) {
	u, err := url.Parse("http://www.abc.com/foo?bar=baz&bar2=baz2")
	require.NoError(t, err)

	uqr, err := NewURLQueryReader(u)
	require.NoError(t, err)

	assert.Equal(t, "baz", uqr.Get("bar", "foodef"), "first param")
	assert.Equal(t, "baz2", uqr.Get("bar2", "foodef"), "second param")
	assert.Equal(t, "foodef", uqr.Get("bar3", "foodef"), "non-existing param, use fallback")
}

// Copied from Go 1.19 tests. Feel free to remove once we remove URLJoinPath
func TestURLJoinPath(t *testing.T) {
	tests := []struct {
		base string
		elem []string
		out  string
	}{
		{
			base: "https://go.googlesource.com",
			elem: []string{"go"},
			out:  "https://go.googlesource.com/go",
		},
		{
			base: "https://go.googlesource.com/a/b/c",
			elem: []string{"../../../go"},
			out:  "https://go.googlesource.com/go",
		},
		{
			base: "https://go.googlesource.com/",
			elem: []string{"./go"},
			out:  "https://go.googlesource.com/go",
		},
		{
			base: "https://go.googlesource.com//",
			elem: []string{"/go"},
			out:  "https://go.googlesource.com/go",
		},
		{
			base: "https://go.googlesource.com//",
			elem: []string{"/go", "a", "b", "c"},
			out:  "https://go.googlesource.com/go/a/b/c",
		},
		{
			base: "http://[fe80::1%en0]:8080/",
			elem: []string{"/go"},
		},
		{
			base: "https://go.googlesource.com",
			elem: []string{"go/"},
			out:  "https://go.googlesource.com/go/",
		},
		{
			base: "https://go.googlesource.com",
			elem: []string{"go//"},
			out:  "https://go.googlesource.com/go/",
		},
		{
			base: "https://go.googlesource.com",
			elem: nil,
			out:  "https://go.googlesource.com",
		},
		{
			base: "https://go.googlesource.com/",
			elem: nil,
			out:  "https://go.googlesource.com/",
		},
		{
			base: "https://go.googlesource.com/a%2fb",
			elem: []string{"c"},
			out:  "https://go.googlesource.com/a%2fb/c",
		},
		{
			base: "https://go.googlesource.com/a%2fb",
			elem: []string{"c%2fd"},
			out:  "https://go.googlesource.com/a%2fb/c%2fd",
		},
		{
			base: "/",
			elem: nil,
			out:  "/",
		},
	}
	for _, tt := range tests {
		wantErr := "nil"
		if tt.out == "" {
			wantErr = "non-nil error"
		}
		if out, err := URLJoinPath(tt.base, tt.elem...); out != tt.out || (err == nil) != (tt.out != "") {
			t.Errorf("JoinPath(%q, %q) = %q, %v, want %q, %v", tt.base, tt.elem, out, err, tt.out, wantErr)
		}
		var out string
		u, err := url.Parse(tt.base)
		if err == nil {
			u = urlJoinPath(u, tt.elem...)
			out = u.String()
		}
		if out != tt.out || (err == nil) != (tt.out != "") {
			t.Errorf("Parse(%q).JoinPath(%q) = %q, %v, want %q, %v", tt.base, tt.elem, out, err, tt.out, wantErr)
		}
	}
}
