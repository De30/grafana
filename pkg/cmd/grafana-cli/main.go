package main

import (
	"os"

	"github.com/grafana/grafana/pkg/cmd/grafana-cli/commands"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/runner"
)

// Version is overridden by build flags
var version = "main"

func main() {
	os.Exit(commands.RunCLI(runner.Initialize, version))
}
