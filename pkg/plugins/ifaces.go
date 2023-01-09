package plugins

type PluginSource struct {
	Class Class
	Paths []string
}

type CompatOpts struct {
	GrafanaVersion string
	OS             string
	Arch           string
}
