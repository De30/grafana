package pipelines

import (
	"path/filepath"
	"time"

	"github.com/grafana/grafana/pkg/build/config"
	"github.com/grafana/grafana/pkg/build/grafana"
)

type BuildGrafanaOpts struct {
	Variant config.Variant
	Edition config.Edition

	Version   string
	SHA       string
	Branch    string
	Workdir   string
	Timestamp time.Time
}

func (o *BuildGrafanaOpts) GoBuildArgs() grafana.BuildArgs {
	return grafana.VariantBuildArgs(o.Variant)
}

// Output returns the path to the compiled artifact for the binary "bin". Example bin: "grafana-server".
func (o *BuildGrafanaOpts) Output(bin string) string {
	ba := o.GoBuildArgs()

	return filepath.Join(ba.Workdir, "bin", grafana.BinaryFolder(o.Edition, ba), bin)
}

func BuildGrafanaCommand(cmd string, opts *BuildGrafanaOpts) []string {
	goArgs := opts.GoBuildArgs()
	goArgs.Package = "./pkg/cmd/" + cmd

	revision := config.Revision{
		Timestamp: opts.Timestamp.Unix(),
		SHA256:    opts.SHA,
		Branch:    opts.Branch,
	}

	bin := cmd
	if goArgs.GoOS == config.OSWindows {
		bin += grafana.ExtensionExe
	}

	// TBD: Should I be using filepath.Join or path.Join for portability since technically
	// this will be running on Docker? I wouldn't want Windows users to be creating paths with \
	// only for them the docker container to return an error because of it
	goArgs.Output = opts.Output(bin)
	goArgs.LdFlags = append(goArgs.LdFlags, grafana.GrafanaLDFlags(opts.Version, revision)...)

	if opts.Edition == config.EditionEnterprise2 {
		goArgs.ExtraArgs = []string{"-tags=pro"}
	}

	return append([]string{"go", "build"}, goArgs.Args()...)
}

func BuildGrafanaCLICommand(opts *BuildGrafanaOpts) []string {
	return BuildGrafanaCommand("grafana-cli", opts)
}

func BuildGrafanaServerCommand(opts *BuildGrafanaOpts) []string {
	return BuildGrafanaCommand("grafana-server", opts)
}
