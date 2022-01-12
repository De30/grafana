package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
)

var (
	ReqGrafanaAdmin = Auth(&AuthOptions{
		ReqSignedIn:     true,
		ReqGrafanaAdmin: true,
	})
	ReqSignedIn            = Auth(&AuthOptions{ReqSignedIn: true})
	ReqSignedInNoAnonymous = Auth(&AuthOptions{ReqSignedIn: true, ReqNoAnonynmous: true})
	ReqEditorRole          = RoleAuth(models.ROLE_EDITOR, models.ROLE_ADMIN)
	ReqOrgAdmin            = RoleAuth(models.ROLE_ADMIN)
)

func HandleNoCacheHeader(ctx *models.ReqContext) {
	ctx.SkipCache = ctx.Req.Header.Get("X-Grafana-NoCache") == "true"
}

func AddDefaultResponseHeaders(cfg *setting.Cfg) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !strings.HasPrefix(r.URL.Path, "/api/datasources/proxy/") {
				addNoCacheHeaders(w)
			}

			if !cfg.AllowEmbedding {
				addXFrameOptionsDenyHeader(w)
			}

			addSecurityHeaders(w, cfg)
			next.ServeHTTP(w, r)
		})
	}
}

// addSecurityHeaders adds HTTP(S) response headers that enable various security protections in the client's browser.
func addSecurityHeaders(w http.ResponseWriter, cfg *setting.Cfg) {
	if (cfg.Protocol == setting.HTTPSScheme || cfg.Protocol == setting.HTTP2Scheme) && cfg.StrictTransportSecurity {
		strictHeaderValues := []string{fmt.Sprintf("max-age=%v", cfg.StrictTransportSecurityMaxAge)}
		if cfg.StrictTransportSecurityPreload {
			strictHeaderValues = append(strictHeaderValues, "preload")
		}
		if cfg.StrictTransportSecuritySubDomains {
			strictHeaderValues = append(strictHeaderValues, "includeSubDomains")
		}
		w.Header().Set("Strict-Transport-Security", strings.Join(strictHeaderValues, "; "))
	}

	if cfg.ContentTypeProtectionHeader {
		w.Header().Set("X-Content-Type-Options", "nosniff")
	}

	if cfg.XSSProtectionHeader {
		w.Header().Set("X-XSS-Protection", "1; mode=block")
	}
}

func addNoCacheHeaders(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "-1")
}

func addXFrameOptionsDenyHeader(w http.ResponseWriter) {
	w.Header().Set("X-Frame-Options", "deny")
}
