package commands

import (
	"fmt"
	"strings"

	"github.com/fatih/color"
	"github.com/urfave/cli/v2"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/commands/datamigrations"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/commands/secretsmigrations"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/logger"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/runner"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/services"
	"github.com/grafana/grafana/pkg/cmd/grafana-cli/utils"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrations"
	"github.com/grafana/grafana/pkg/setting"
)

func runRunnerCommand(command func(commandLine utils.CommandLine, runner runner.Runner) error) func(context *cli.Context) error {
	return func(context *cli.Context) error {
		cmd := &utils.ContextCommandLine{Context: context}

		cfg, err := initCfg(cmd)
		if err != nil {
			return fmt.Errorf("%v: %w", "failed to load configuration", err)
		}

		r, err := runner.Initialize(cfg)
		if err != nil {
			return fmt.Errorf("%v: %w", "failed to initialize runner", err)
		}

		if err := command(cmd, r); err != nil {
			return err
		}

		logger.Info("\n\n")
		return nil
	}
}

func runDbCommand(command func(commandLine utils.CommandLine, sqlStore db.DB) error) func(context *cli.Context) error {
	return func(context *cli.Context) error {
		cmd := &utils.ContextCommandLine{Context: context}

		cfg, err := initCfg(cmd)
		if err != nil {
			return fmt.Errorf("%v: %w", "failed to load configuration", err)
		}

		tracer, err := tracing.ProvideService(cfg)
		if err != nil {
			return fmt.Errorf("%v: %w", "failed to initialize tracer service", err)
		}

		bus := bus.ProvideBus(tracer)

		sqlStore, err := db.ProvideService(cfg, nil, &migrations.OSSMigrations{}, bus, tracer)
		if err != nil {
			return fmt.Errorf("%v: %w", "failed to initialize SQL store", err)
		}

		if err := command(cmd, sqlStore); err != nil {
			return err
		}

		logger.Info("\n\n")
		return nil
	}
}

func initCfg(cmd *utils.ContextCommandLine) (*setting.Cfg, error) {
	configOptions := strings.Split(cmd.String("configOverrides"), " ")
	cfg, err := setting.NewCfgFromArgs(setting.CommandLineArgs{
		Config:   cmd.ConfigFile(),
		HomePath: cmd.HomePath(),
		// tailing arguments have precedence over the options string
		Args: append(configOptions, cmd.Args().Slice()...),
	})

	if err != nil {
		return nil, err
	}

	if cmd.Bool("debug") {
		cfg.LogConfigSources()
	}

	return cfg, nil
}

func runPluginCommand(command func(commandLine utils.CommandLine) error) func(context *cli.Context) error {
	return func(context *cli.Context) error {
		cmd := &utils.ContextCommandLine{Context: context}
		if err := command(cmd); err != nil {
			return err
		}

		logger.Info(color.GreenString("Please restart Grafana after installing plugins. Refer to Grafana documentation for instructions if necessary.\n\n"))
		return nil
	}
}

// Command contains command state.
type Command struct {
	Client utils.ApiClient
}

var cmd Command = Command{
	Client: &services.GrafanaComClient{},
}

var pluginCommands = []*cli.Command{
	{
		Name:   "install",
		Usage:  "install <plugin id> <plugin version (optional)>",
		Action: runPluginCommand(cmd.installCommand),
	}, {
		Name:   "list-remote",
		Usage:  "list remote available plugins",
		Action: runPluginCommand(cmd.listRemoteCommand),
	}, {
		Name:   "list-versions",
		Usage:  "list-versions <plugin id>",
		Action: runPluginCommand(cmd.listVersionsCommand),
	}, {
		Name:    "update",
		Usage:   "update <plugin id>",
		Aliases: []string{"upgrade"},
		Action:  runPluginCommand(cmd.upgradeCommand),
	}, {
		Name:    "update-all",
		Aliases: []string{"upgrade-all"},
		Usage:   "update all your installed plugins",
		Action:  runPluginCommand(cmd.upgradeAllCommand),
	}, {
		Name:   "ls",
		Usage:  "list all installed plugins",
		Action: runPluginCommand(cmd.lsCommand),
	}, {
		Name:    "uninstall",
		Aliases: []string{"remove"},
		Usage:   "uninstall <plugin id>",
		Action:  runPluginCommand(cmd.removeCommand),
	},
}

var adminCommands = []*cli.Command{
	{
		Name:   "reset-admin-password",
		Usage:  "reset-admin-password <new password>",
		Action: runRunnerCommand(resetPasswordCommand),
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  "password-from-stdin",
				Usage: "Read the password from stdin",
				Value: false,
			},
		},
	},
	{
		Name:  "data-migration",
		Usage: "Runs a script that migrates or cleanups data in your database",
		Subcommands: []*cli.Command{
			{
				Name:   "encrypt-datasource-passwords",
				Usage:  "Migrates passwords from unsecured fields to secure_json_data field. Return ok unless there is an error. Safe to execute multiple times.",
				Action: runDbCommand(datamigrations.EncryptDatasourcePasswords),
			},
		},
	},
	{
		Name:  "secrets-migration",
		Usage: "Runs a script that migrates secrets in your database",
		Subcommands: []*cli.Command{
			{
				Name:   "re-encrypt",
				Usage:  "Re-encrypts secrets by decrypting and re-encrypting them with the currently configured encryption. Returns ok unless there is an error. Safe to execute multiple times.",
				Action: runRunnerCommand(secretsmigrations.ReEncryptSecrets),
			},
			{
				Name:   "rollback",
				Usage:  "Rolls back secrets to legacy encryption. Returns ok unless there is an error. Safe to execute multiple times.",
				Action: runRunnerCommand(secretsmigrations.RollBackSecrets),
			},
			{
				Name:   "re-encrypt-data-keys",
				Usage:  "Rotates persisted data encryption keys. Returns ok unless there is an error. Safe to execute multiple times.",
				Action: runRunnerCommand(secretsmigrations.ReEncryptDEKS),
			},
		},
	},
	{
		Name:  "migrate",
		Usage: "Runs migrations",
		Subcommands: []*cli.Command{
			{
				Name:   "version",
				Usage:  "Print current database migration version",
				Action: runMigrateCommand(getMigrationsVersion),
			},
			{
				Name:   "force-version",
				Usage:  "It will force a migration version and reset the dirty state to false without checking any currently active version in database.",
				Action: runMigrateCommand(forceMigrationsVersion),
				Flags: []cli.Flag{
					&cli.IntFlag{
						Name:     "version",
						Usage:    "Target version",
						Required: true,
					},
				},
			},
			{
				Name:   "list",
				Usage:  "List migrations",
				Action: runMigrateCommand(listMigrations),
			},
			{
				Name:   "run-steps",
				Usage:  "If steps are provided it will migrate up if steps > 0, and down if steps < 0.\nIt does nothing if steps is zero",
				Action: runMigrateCommand(runMigrationsSteps),
				Flags: []cli.Flag{
					&cli.Int64Flag{
						Name:     "steps",
						Usage:    "Number of steps",
						Required: true,
					},
				},
			},
			{
				Name:   "run",
				Usage:  "Migrates up or down to the target version",
				Action: runMigrateCommand(runMigrations),
				Flags: []cli.Flag{
					&cli.UintFlag{
						Name:     "version",
						Usage:    "Targer version",
						Required: true,
					},
					&cli.BoolFlag{
						Name:     "dry-run",
						Usage:    "Dry run migrations",
						Required: false,
						Value:    false,
					},
				},
			},
		},
	},
	{
		Name:  "user-manager",
		Usage: "Runs different helpful user commands",
		Subcommands: []*cli.Command{
			// TODO: reset password for user
			{
				Name:  "conflicts",
				Usage: "runs a conflict resolution to find users with multiple entries",
				CustomHelpTemplate: `
This command will find users with multiple entries in the database and try to resolve the conflicts.
explanation of each field:

explanation of each field:
* email - the user’s email
* login - the user’s login/username
* last_seen_at - the user’s last login
* auth_module - if the user was created/signed in using an authentication provider
* conflict_email - a boolean if we consider the email to be a conflict
* conflict_login - a boolean if we consider the login to be a conflict

# lists all the conflicting users
grafana-cli user-manager conflicts list

# creates a conflict patch file to edit
grafana-cli user-manager conflicts generate-file

# reads edited conflict patch file for validation
grafana-cli user-manager conflicts validate-file <filepath>

# validates and ingests edited patch file
grafana-cli user-manager conflicts ingest-file <filepath>
`,
				Subcommands: []*cli.Command{
					{
						Name:   "list",
						Usage:  "returns a list of users with more than one entry in the database",
						Action: runListConflictUsers(),
					},
					{
						Name:   "generate-file",
						Usage:  "creates a conflict users file. Safe to execute multiple times.",
						Action: runGenerateConflictUsersFile(),
					},
					{
						Name:   "validate-file",
						Usage:  "validates the conflict users file. Safe to execute multiple times.",
						Action: runValidateConflictUsersFile(),
					},
					{
						Name:   "ingest-file",
						Usage:  "ingests the conflict users file. > Note: This is irreversible it will change the state of the database.",
						Action: runIngestConflictUsersFile(),
					},
				},
			},
		},
	},
}

var Commands = []*cli.Command{
	{
		Name:        "plugins",
		Usage:       "Manage plugins for grafana",
		Subcommands: pluginCommands,
	},
	{
		Name:        "admin",
		Usage:       "Grafana admin commands",
		Subcommands: adminCommands,
	},
}
