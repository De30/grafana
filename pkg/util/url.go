package util

import (
	"net/url"
	"path"
	"strings"
)

// URLQueryReader is a ApiURL query type.
type URLQueryReader struct {
	values url.Values
}

// NewURLQueryReader parses a raw query and returns it as a URLQueryReader type.
func NewURLQueryReader(urlInfo *url.URL) (*URLQueryReader, error) {
	u, err := url.ParseQuery(urlInfo.RawQuery)
	if err != nil {
		return nil, err
	}

	return &URLQueryReader{
		values: u,
	}, nil
}

// Get parse parameters from an ApiURL. If the parameter does not exist, it returns
// the default value.
func (r *URLQueryReader) Get(name string, def string) string {
	val := r.values[name]
	if len(val) == 0 {
		return def
	}

	return val[0]
}

// JoinURLFragments joins two ApiURL fragments into only one ApiURL string.
func JoinURLFragments(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")

	if len(b) == 0 {
		return a
	}

	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

// URLJoinPath returns a URL string with the provided path elements
// joined to the existing path of base and the resulting path cleaned
// of any ./ or ../ elements.
//
// This is a copy of the url.JoinPath method introduced in Go 1.19. It
// should be removed once Grafana sets the minimium Go version to that
// one.
func URLJoinPath(base string, elem ...string) (string, error) {
	u, err := url.Parse(base)
	if err != nil {
		return "", err
	}
	return urlJoinPath(u, elem...).String(), nil
}

// urlJoinPath returns a new URL with the provided path elements
// joined to any existing path and the resulting path cleaned of any
// ./ or ../ elements. Any sequences of multiple / characters will be
// reduced to a single /.
//
// This is a copy of the URL.JoinPath method introduced in Go 1.19. It
// should be removed once Grafana sets the minimium Go version to that
// one.
func urlJoinPath(u *url.URL, elem ...string) *url.URL {
	url := *u
	if len(elem) > 0 {
		elem = append([]string{u.EscapedPath()}, elem...)
		p := path.Join(elem...)
		// path.Join will remove any trailing slashes.
		// Preserve at least one.
		if strings.HasSuffix(elem[len(elem)-1], "/") && !strings.HasSuffix(p, "/") {
			p += "/"
		}
		urlSetPath(&url, p)
	}
	return &url
}

// urlSetPath sets the Path and RawPath fields of the URL based on the provided
// escaped path p. It maintains the invariant that RawPath is only specified
// when it differs from the default encoding of the path.
// For example:
// - setPath("/foo/bar")   will set Path="/foo/bar" and RawPath=""
// - setPath("/foo%2fbar") will set Path="/foo/bar" and RawPath="/foo%2fbar"
// setPath will return an error only if the provided path contains an invalid
// escaping.
func urlSetPath(u *url.URL, p string) error {
	path, err := url.PathUnescape(p)
	if err != nil {
		return err
	}
	u.Path = path
	if escp := url.PathEscape(path); p == escp {
		// Default encoding is fine.
		u.RawPath = ""
	} else {
		u.RawPath = p
	}
	return nil
}
