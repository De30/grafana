package grn

import (
	"fmt"
	"strconv"
	"strings"
)

// Grafana resource name.  See also:
// https://github.com/grafana/grafana/blob/main/pkg/services/store/object/object.proto#L6
// NOTE: This structure/format is still under active development and is subject to change
type GRN struct {
	// TenantID contains the ID of the tenant (in hosted grafana) or
	// organization (in other environments) the resource belongs to. This field
	// may be omitted for global Grafana resources which are not associated with
	// an organization.
	TenantID int64

	// The kind of resource being identified, for e.g. "dashboard" or "user".
	// The caller is responsible for validating the value.
	ResourceKind string

	// ResourceIdentifier is used by the underlying service to identify the
	// resource.
	ResourceIdentifier string

	// GRN can not be extended
	_ interface{}
}

// ParseStr attempts to parse a string into a GRN. It returns an error if the
// given string does not match the GRN format, but does not validate the values.
func ParseStr(str string) (GRN, error) {
	ret := GRN{}
	parts := strings.Split(str, ":")

	if len(parts) != 3 {
		return ret, ErrInvalidGRN.Errorf("%q is not a complete GRN", str)
	}

	if parts[0] != "grn" {
		return ret, ErrInvalidGRN.Errorf("%q does not look like a GRN", str)
	}

	// split the final segment into Kind and ID. This only splits after the
	// first occurrence of "/"; a ResourceIdentifier may contain "/"
	kind, id, found := strings.Cut(parts[2], "/")
	if !found { // missing "/"
		return ret, ErrInvalidGRN.Errorf("invalid resource identifier in GRN %q", str)
	}
	ret.ResourceIdentifier = id
	ret.ResourceKind = kind

	if parts[1] != "" {
		tID, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			return ret, ErrInvalidGRN.Errorf("ID segment cannot be converted to an integer")
		} else {
			ret.TenantID = tID
		}
	}

	return ret, nil
}

// ValidateUID will return an error if the UID constraints are not matched
func ValidateUID(uid string) error {
	if uid == "" {
		return ErrInvalidUID.Errorf("empty UID")
	}
	if len(uid) > 253 {
		return ErrInvalidUID.Errorf("uid is too long (%d > 253)", len(uid))
	}

	// k8s constraints have:
	// https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names
	// * contain no more than 253 characters
	// * contain only lowercase alphanumeric characters, '-' or '.'
	// * start with an alphanumeric character
	// * end with an alphanumeric character

	// this matches the current implicit rules enforced by using macron to parse uids from a URL ¯\_(ツ)_/¯
	if strings.ContainsAny(uid, "/%?#") {
		return ErrInvalidUID.Errorf("uid contains invalid characters")
	}
	return nil
}

// MustParseStr is a wrapper around ParseStr that panics if the given input is
// not a valid GRN. This is intended for use in tests.
func MustParseStr(str string) GRN {
	grn, err := ParseStr(str)
	if err != nil {
		panic("bad grn!")
	}
	return grn
}

// String returns a string representation of a grn in the format
// grn:tenantID:kind/resourceIdentifier
func (g *GRN) String() string {
	return fmt.Sprintf("grn:%d:%s/%s", g.TenantID, g.ResourceKind, g.ResourceIdentifier)
}
