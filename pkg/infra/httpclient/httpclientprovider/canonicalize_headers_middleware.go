package httpclientprovider

import (
	"net/http"
	"net/textproto"

	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
)

const CanonicalizedHeadersMiddlewareName = "canonicalized-headers"

// CanonicalizedHeadersMiddleware is a middleware that takes all the headers in the request and
// ensures that they will be sent in MIME canonical format. If there are clashing headers (different
// headers in the request, but same canonical MIME key), then the one that is already in canonical form
// takes precedence.
func CanonicalizedHeadersMiddleware() httpclient.Middleware {
	return httpclient.NamedMiddlewareFunc(CanonicalizedHeadersMiddlewareName, func(opts httpclient.Options, next http.RoundTripper) http.RoundTripper {
		return httpclient.RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
			newHeaders := http.Header{}
			for k, v := range req.Header {
				canonicalKey := textproto.CanonicalMIMEHeaderKey(k)
				if k != canonicalKey && len(newHeaders[canonicalKey]) > 0 {
					// Original key is NOT canonical, ignore if we already have a canonical key.
					continue
				}
				newHeaders[canonicalKey] = v
			}
			req.Header = newHeaders
			return next.RoundTrip(req)
		})
	})
}
