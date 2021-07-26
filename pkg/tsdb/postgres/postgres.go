package postgres

import (
	"fmt"
	"net/url"
	"reflect"
	"strconv"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/sqlutil"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util/errutil"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/tsdb/sqleng"
)

func init() {
	registry.Register(&registry.Descriptor{
		Name:         "PostgresService",
		InitPriority: registry.Low,
		Instance:     &PostgresService{},
	})
}

type PostgresService struct {
	Cfg        *setting.Cfg `inject:""`
	logger     log.Logger
	tlsManager tlsSettingsProvider
}

func (s *PostgresService) Init() error {
	s.logger = log.New("tsdb.postgres")
	s.tlsManager = newTLSManager(s.logger, s.Cfg.DataPath)
	return nil
}

//nolint: staticcheck // plugins.DataPlugin deprecated
func (s *PostgresService) NewExecutor(datasource *models.DataSource) (plugins.DataPlugin, error) {
	s.logger.Debug("Creating Postgres query endpoint")

	cnnstr, err := s.generateConnectionString(datasource)
	if err != nil {
		return nil, err
	}

	if s.Cfg.Env == setting.Dev {
		s.logger.Debug("getEngine", "connection", cnnstr)
	}

	config := sqleng.DataPluginConfiguration{
		DriverName:        "postgres",
		ConnectionString:  cnnstr,
		Datasource:        datasource,
		MetricColumnTypes: []string{"UNKNOWN", "TEXT", "VARCHAR", "CHAR"},
	}

	queryResultTransformer := postgresQueryResultTransformer{
		log: s.logger,
	}

	timescaledb := datasource.JsonData.Get("timescaledb").MustBool(false)

	plugin, err := sqleng.NewDataPlugin(config, &queryResultTransformer, newPostgresMacroEngine(timescaledb),
		s.logger)
	if err != nil {
		s.logger.Error("Failed connecting to Postgres", "err", err)
		return nil, err
	}

	s.logger.Debug("Successfully connected to Postgres")
	return plugin, nil
}

// escape single quotes and backslashes in Postgres connection string parameters.
func escape(input string) string {
	return strings.ReplaceAll(strings.ReplaceAll(input, `\`, `\\`), "'", `\'`)
}

func (s *PostgresService) generateConnectionString(datasource *models.DataSource) (string, error) {
	var host string
	var port int
	if strings.HasPrefix(datasource.Url, "/") {
		host = datasource.Url
		s.logger.Debug("Generating connection string with Unix socket specifier", "socket", host)
	} else {
		sp := strings.SplitN(datasource.Url, ":", 2)
		host = sp[0]
		if len(sp) > 1 {
			var err error
			port, err = strconv.Atoi(sp[1])
			if err != nil {
				return "", errutil.Wrapf(err, "invalid port in host specifier %q", sp[1])
			}

			s.logger.Debug("Generating connection string with network host/port pair", "host", host, "port", port)
		} else {
			s.logger.Debug("Generating connection string with network host", "host", host)
		}
	}

	var c strings.Builder
	if strings.Contains(datasource.User, " ") {
		if port > 0 {
			psswd := datasource.DecryptedPassword()
			if len(psswd) > 0 {
				c.WriteString(fmt.Sprintf("postgres://%s:%s@%s:%d/%s",
					url.PathEscape(escape(datasource.User)),
					url.PathEscape(escape(psswd)),
					url.PathEscape(escape(host)),
					port,
					url.PathEscape(escape(datasource.Database))),
				)
			} else {
				c.WriteString(fmt.Sprintf("postgres://%s@%s:%d/%s",
					url.PathEscape(escape(datasource.User)),
					url.PathEscape(escape(host)),
					port,
					url.PathEscape(escape(datasource.Database))),
				)
			}
		} else {
			c.WriteString(fmt.Sprintf("postgres://%s:%s@%s/%s",
				url.PathEscape(escape(datasource.User)),
				url.PathEscape(escape(datasource.DecryptedPassword())),
				url.PathEscape(escape(host)),
				url.PathEscape(escape(datasource.Database))),
			)
		}

		tlsSettings, err := s.tlsManager.getTLSSettings(datasource)
		if err != nil {
			return "", err
		}

		// add params
		c.WriteString(fmt.Sprintf("?%s=%s", "sslmode", url.QueryEscape(escape(tlsSettings.Mode))))

		if tlsSettings.RootCertFile != "" {
			s.logger.Debug("Setting server root certificate", "tlsRootCert", tlsSettings.RootCertFile)
			c.WriteString(fmt.Sprintf("&%s=%s", "sslrootcert", url.QueryEscape(escape(tlsSettings.RootCertFile))))
		}

		// Attach client certificate and key if both are provided
		if tlsSettings.CertFile != "" && tlsSettings.CertKeyFile != "" {
			s.logger.Debug("Setting TLS/SSL client auth", "tlsCert", tlsSettings.CertFile, "tlsKey", tlsSettings.CertKeyFile)
			c.WriteString(fmt.Sprintf("&%s=%s", "sslcert", url.QueryEscape(escape(tlsSettings.CertFile))))
			c.WriteString(fmt.Sprintf("&%s=%s", "sslkey", url.QueryEscape(escape(tlsSettings.CertKeyFile))))
		} else if tlsSettings.CertFile != "" || tlsSettings.CertKeyFile != "" {
			return "", fmt.Errorf("TLS/SSL client certificate and key must both be specified")
		}

		return c.String(), nil
	}

	connStr := fmt.Sprintf("user='%s' password='%s' host='%s' dbname='%s'",
		escape(datasource.User), escape(datasource.DecryptedPassword()), escape(host), escape(datasource.Database))
	if port > 0 {
		connStr += fmt.Sprintf(" port=%d", port)
	}

	tlsSettings, err := s.tlsManager.getTLSSettings(datasource)
	if err != nil {
		return "", err
	}

	connStr += fmt.Sprintf(" sslmode='%s'", escape(tlsSettings.Mode))

	// Attach root certificate if provided
	if tlsSettings.RootCertFile != "" {
		s.logger.Debug("Setting server root certificate", "tlsRootCert", tlsSettings.RootCertFile)
		connStr += fmt.Sprintf(" sslrootcert='%s'", escape(tlsSettings.RootCertFile))
	}

	// Attach client certificate and key if both are provided
	if tlsSettings.CertFile != "" && tlsSettings.CertKeyFile != "" {
		s.logger.Debug("Setting TLS/SSL client auth", "tlsCert", tlsSettings.CertFile, "tlsKey", tlsSettings.CertKeyFile)
		connStr += fmt.Sprintf(" sslcert='%s' sslkey='%s'", escape(tlsSettings.CertFile), escape(tlsSettings.CertKeyFile))
	} else if tlsSettings.CertFile != "" || tlsSettings.CertKeyFile != "" {
		return "", fmt.Errorf("TLS/SSL client certificate and key must both be specified")
	}

	s.logger.Debug("Generated Postgres connection string successfully")
	return connStr, nil
}

type postgresQueryResultTransformer struct {
	log log.Logger
}

func (t *postgresQueryResultTransformer) TransformQueryError(err error) error {
	return err
}

func (t *postgresQueryResultTransformer) GetConverterList() []sqlutil.StringConverter {
	return []sqlutil.StringConverter{
		{
			Name:           "handle FLOAT4",
			InputScanKind:  reflect.Interface,
			InputTypeName:  "FLOAT4",
			ConversionFunc: func(in *string) (*string, error) { return in, nil },
			Replacer: &sqlutil.StringFieldReplacer{
				OutputFieldType: data.FieldTypeNullableFloat64,
				ReplaceFunc: func(in *string) (interface{}, error) {
					if in == nil {
						return nil, nil
					}
					v, err := strconv.ParseFloat(*in, 64)
					if err != nil {
						return nil, err
					}
					return &v, nil
				},
			},
		},
		{
			Name:           "handle FLOAT8",
			InputScanKind:  reflect.Interface,
			InputTypeName:  "FLOAT8",
			ConversionFunc: func(in *string) (*string, error) { return in, nil },
			Replacer: &sqlutil.StringFieldReplacer{
				OutputFieldType: data.FieldTypeNullableFloat64,
				ReplaceFunc: func(in *string) (interface{}, error) {
					if in == nil {
						return nil, nil
					}
					v, err := strconv.ParseFloat(*in, 64)
					if err != nil {
						return nil, err
					}
					return &v, nil
				},
			},
		},
		{
			Name:           "handle NUMERIC",
			InputScanKind:  reflect.Interface,
			InputTypeName:  "NUMERIC",
			ConversionFunc: func(in *string) (*string, error) { return in, nil },
			Replacer: &sqlutil.StringFieldReplacer{
				OutputFieldType: data.FieldTypeNullableFloat64,
				ReplaceFunc: func(in *string) (interface{}, error) {
					if in == nil {
						return nil, nil
					}
					v, err := strconv.ParseFloat(*in, 64)
					if err != nil {
						return nil, err
					}
					return &v, nil
				},
			},
		},
		{
			Name:           "handle INT2",
			InputScanKind:  reflect.Interface,
			InputTypeName:  "INT2",
			ConversionFunc: func(in *string) (*string, error) { return in, nil },
			Replacer: &sqlutil.StringFieldReplacer{
				OutputFieldType: data.FieldTypeNullableInt16,
				ReplaceFunc: func(in *string) (interface{}, error) {
					if in == nil {
						return nil, nil
					}
					i64, err := strconv.ParseInt(*in, 10, 16)
					if err != nil {
						return nil, err
					}
					v := int16(i64)
					return &v, nil
				},
			},
		},
	}
}
