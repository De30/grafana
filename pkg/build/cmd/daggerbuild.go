package main

import (
	"context"
	"log"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/build/cmd/pipelines"
	"github.com/grafana/grafana/pkg/build/config"
	"github.com/grafana/grafana/pkg/build/grafana"
	"github.com/urfave/cli/v2"

	"dagger.io/dagger"
)

const GrafanaRepository = "https://github.com/grafana/grafana.git"

func daggerCommands() cli.Commands {
	return cli.Commands{
		{
			Name:   "build",
			Action: DaggerBuildPipeline,
		},
	}
}

func DaggerBuildPipeline(c *cli.Context) error {
	opts, err := GetDaggerBuildOpts(c)
	if err != nil {
		return err
	}

	if err := DaggerBuild(c.Context, opts); err != nil {
		return err
	}

	return filepath.Walk("build", func(name string, info os.FileInfo, err error) error {
		if !info.IsDir() {
			log.Println(name)
		}
		return nil
	})
}

type DaggerBuildOpts struct {
	Clone      bool   // Clone defines whether the repository should be cloned in the dagger pipeline.
	Branch     string // Branch refers to the branch to check out of `clone` is true.
	SourcePath string // SourcePath will be set to argc[1] if provided. If Clone is false, then this value will be ignored.
	Version    string // Version is provided with the `--version` argument. Defaults to v0.0.0.
	Editions   []config.Edition
	Variants   []config.Variant
}

func GetDaggerBuildOpts(c *cli.Context) (*DaggerBuildOpts, error) {
	opts := &DaggerBuildOpts{
		Clone: true,
		Editions: []config.Edition{
			config.EditionOSS,
		},
		Variants: []config.Variant{
			config.VariantLinuxAmd64,
			config.VariantLinuxAmd64Musl,
			config.VariantDarwinAmd64,
			config.VariantWindowsAmd64,
		},
		Version: "v0.0.0",
	}

	if path := c.Args().First(); path == "" {
		opts.Clone = false
		opts.SourcePath = path
	}

	if v := c.String("version"); v != "" {
		opts.Version = v
	}

	return opts, nil
}

func DaggerBuild(ctx context.Context, opts *DaggerBuildOpts) error {
	// g, ctx := errgroup.WithContext(ctx)
	var (
		dir *dagger.Directory
	)

	client, err := dagger.Connect(ctx, dagger.WithLogOutput(os.Stdout))
	if err != nil {
		return err
	}
	defer client.Close()

	if opts.Clone {
		repo := client.Git(GrafanaRepository)
		dir = repo.Branch(opts.Branch).Tree()
	}

	// Get golang image and mount go source
	imageTag := "golang:1.19"
	builder := client.Container().From(imageTag).
		WithMountedDirectory("/src", dir).WithWorkdir("/src")

	for _, edition := range opts.Editions {
		// Run matrix builds in parallel
		for _, variant := range opts.Variants {
			buildOpts := grafana.BuildVariantOpts{
				Variant:    variant,
				Edition:    edition,
				GrafanaDir: "/src",
			}

			if err := buildOsArch(ctx, builder, buildOpts, "grafana-server"); err != nil {
				return err
			}
		}
	}
	// if err := g.Wait(); err != nil {
	// 	return err
	// }
	return nil
}

func buildOsArch(ctx context.Context, builder *dagger.Container, opts grafana.BuildVariantOpts, binary string) error {
	log.Println("Building", opts.Edition, opts.String())
	args := grafana.VariantBuildArgs(opts.Variant)
	for _, v := range args.Env() {
		log.Println("Setting environment variable", v)
		var (
			s     = strings.Split(v, "=")
			name  = s[0]
			value = ""
		)

		if len(s) > 1 {
			value = s[1]
		}

		builder = builder.WithEnvVariable(name, value)
	}

	command := pipelines.BuildGrafanaCLICommand(&pipelines.BuildGrafanaOpts{
		Variant: opts.Variant,
		Edition: opts.Edition,
		Version: opts.Version,

		SHA:       "1234",
		Branch:    "main",
		Workdir:   "/src",
		Timestamp: time.Now(),
	})

	log.Println("Running", strings.Join(command, " "))

	builder = builder.Exec(dagger.ContainerExecOpts{
		Args: command,
	})

	out := path.Join("bin", grafana.BinaryFolder(opts.Edition, args), binary)

	log.Println("copying binary", out, "...")
	dir := builder.Directory(out)
	if err := os.MkdirAll(filepath.Join(".", out), os.ModePerm); err != nil {
		return err
	}
	log.Println("done making directory")

	log.Println("exporting...")
	if _, err := dir.Export(ctx, filepath.Join(".", out)); err != nil {
		return err
	}
	log.Println("done copying binary from contianer")
	return nil
	// // Create the output path for the build
	// // Set GOARCH and GOOS and build
	// build := builder.WithEnvVariable("GOOS", goos)
	// build = build.WithEnvVariable("GOARCH", goarch)
	// build = build.Exec(dagger.ContainerExecOpts{
	// 	Args: []string{"go", "build", "-o", path},
	// })

	// // Get build output from builder
	// output := build.Directory(path)

	// // Write the build output to the host
	// _, err = output.Export(ctx, path)
}
