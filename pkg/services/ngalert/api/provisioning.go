package api

import (
	"net/http"
)

const ProvisioningHeader = "X-Grafana-Provenance"

func Provenance(req *http.Request) string {
	return req.Header.Get(ProvisioningHeader)
}
