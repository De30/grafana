package main

import (
	"os"

	"github.com/grafana/grafana/pkg/cmd/grafana-cli/commands"
)

// Version is overridden by build flags
var version = "main"
var commit = "NA"
var buildBranch = "main"
var buildstamp string

func main() {
	os.Exit(commands.RunCLI(version, commit, buildBranch, buildstamp))
}
