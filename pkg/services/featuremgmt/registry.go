// To change feature flags, edit:
//  pkg/services/featuremgmt/registry.go
// Then run tests in:
//  pkg/services/featuremgmt/toggles_gen_test.go
// twice to generate and validate the feature flag files

package featuremgmt

var (
	// Register each toggle here
	standardFeatureFlags = []FeatureFlag{
		{
			Name:        "alertingBigTransactions",
			Description: "Use big transactions for alerting database writes",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "promQueryBuilder",
			Description:  "Show Prometheus query builder",
			State:        FeatureStateStable,
			Expression:   "true", // on by default
			FrontendOnly: true,
		},
		{
			Name:        "trimDefaults",
			Description: "Use cue schema to remove values that will be applied automatically",
			State:       FeatureStateBeta,
		},
		{
			Name:        "disableEnvelopeEncryption",
			Description: "Disable envelope encryption (emergency only)",
			State:       FeatureStateStable,
		},
		{
			Name:        "database_metrics",
			Description: "Add Prometheus metrics for database tables",
			State:       FeatureStateStable,
		},
		{
			Name:        "dashboardPreviews",
			Description: "Create and show thumbnails for dashboard search results",
			State:       FeatureStateAlpha,
		},
		{
			Name:            "dashboardPreviewsAdmin",
			Description:     "Manage the dashboard previews crawler process from the UI",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:        "live-config",
			Description: "Save Grafana Live configuration in SQL tables",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "live-pipeline",
			Description: "Enable a generic live processing pipeline",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "live-service-web-worker",
			Description:  "This will use a webworker thread to processes events rather than the main thread",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:         "queryOverLive",
			Description:  "Use Grafana Live WebSocket to execute backend queries",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:        "panelTitleSearch",
			Description: "Search for dashboards using panel title",
			State:       FeatureStateBeta,
		},
		{
			Name:         "tempoApmTable",
			Description:  "Show APM table",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:        "prometheusAzureOverrideAudience",
			Description: "Experimental. Allow override default AAD audience for Azure Prometheus endpoint",
			State:       FeatureStateBeta,
		},
		{
			Name:         "influxdbBackendMigration",
			Description:  "Query InfluxDB InfluxQL without the proxy",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:            "showFeatureFlagsInUI",
			Description:     "Show feature flags in the settings UI",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:        "publicDashboards",
			Description: "Enables public access to dashboards",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "lokiLive",
			Description: "Support WebSocket streaming for loki (early prototype)",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "lokiDataframeApi",
			Description: "Use experimental loki api for WebSocket streaming (early prototype)",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "lokiMonacoEditor",
			Description:  "Access to Monaco query editor for Loki",
			State:        FeatureStateStable,
			Expression:   "true",
			FrontendOnly: true,
		},
		{
			Name:        "swaggerUi",
			Description: "Serves swagger UI",
			State:       FeatureStateBeta,
		},
		{
			Name:        "featureHighlights",
			Description: "Highlight Grafana Enterprise features",
			State:       FeatureStateStable,
		},
		{
			Name:        "dashboardComments",
			Description: "Enable dashboard-wide comments",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "annotationComments",
			Description: "Enable annotation comments",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "migrationLocking",
			Description: "Lock database during migrations",
			State:       FeatureStateBeta,
		},
		{
			Name:        "storage",
			Description: "Configurable storage for dashboards, datasources, and resources",
			State:       FeatureStateAlpha,
		},
		{
			Name:            "dashboardsFromStorage",
			Description:     "Load dashboards from the generic storage interface",
			State:           FeatureStateAlpha,
			RequiresDevMode: true, // Also a gate on automatic git storage (for now)
		},
		{
			Name:            "export",
			Description:     "Export grafana instance (to git, etc)",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:            "azureMonitorResourcePickerForMetrics",
			Description:     "New UI for Azure Monitor Metrics Query",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
			FrontendOnly:    true,
		},
		{
			Name:         "exploreMixedDatasource",
			Description:  "Enable mixed datasource in Explore",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:         "tracing",
			Description:  "Adds trace ID to error notifications",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:         "commandPalette",
			Description:  "Enable command palette",
			State:        FeatureStateStable,
			Expression:   "true", // enabled by default
			FrontendOnly: true,
		},
		{
			Name:        "correlations",
			Description: "Correlations page",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "cloudWatchDynamicLabels",
			Description: "Use dynamic labels instead of alias patterns in CloudWatch datasource",
			State:       FeatureStateStable,
			Expression:  "true", // enabled by default
		},
		{
			Name:        "datasourceQueryMultiStatus",
			Description: "Introduce HTTP 207 Multi Status for api/ds/query",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "traceToMetrics",
			Description:  "Enable trace to metrics links",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:        "prometheusBufferedClient",
			Description: "Enable buffered (old) client for Prometheus datasource as default instead of streaming JSON parser client (new)",
			State:       FeatureStateStable,
		},
		{
			Name:        "newDBLibrary",
			Description: "Use jmoiron/sqlx rather than xorm for a few backend services",
			State:       FeatureStateBeta,
		},
		{
			Name:            "validateDashboardsOnSave",
			Description:     "Validate dashboard JSON POSTed to api/dashboards/db",
			State:           FeatureStateBeta,
			RequiresRestart: true,
		},
		{
			Name:         "autoMigrateGraphPanels",
			Description:  "Replace the angular graph panel with timeseries",
			State:        FeatureStateBeta,
			FrontendOnly: true,
		},
		{
			Name:        "prometheusWideSeries",
			Description: "Enable wide series responses in the Prometheus datasource",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "canvasPanelNesting",
			Description:  "Allow elements nesting",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:         "scenes",
			Description:  "Experimental framework to build interactive dashboards",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:            "disableSecretsCompatibility",
			Description:     "Disable duplicated secret storage in legacy tables",
			State:           FeatureStateAlpha,
			RequiresRestart: true,
		},
		{
			Name:        "logRequestsInstrumentedAsUnknown",
			Description: "Logs the path for requests that are instrumented as unknown",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "dataConnectionsConsole",
			Description: "Enables a new top-level page called Connections. This page is an experiment that provides a better experience when you install and configure data sources and other plugins.",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "internationalization",
			Description: "Enables internationalization",
			State:       FeatureStateStable,
			Expression:  "true", // enabled by default
		},
		{
			Name:        "topnav",
			Description: "New top nav and page layouts",
			State:       FeatureStateAlpha,
		},
		{
			Name:            "grpcServer",
			Description:     "Run GRPC server",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:            "entityStore",
			Description:     "SQL-based entity store (requires storage flag also)",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:        "traceqlEditor",
			Description: "Show the TraceQL editor in the explore page",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "flameGraph",
			Description: "Show the flame graph",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "cloudWatchCrossAccountQuerying",
			Description: "Use cross-account querying in CloudWatch datasource",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "redshiftAsyncQueryDataSupport",
			Description:  "Enable async query data support for Redshift",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:         "athenaAsyncQueryDataSupport",
			Description:  "Enable async query data support for Athena",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:        "increaseInMemDatabaseQueryCache",
			Description: "Enable more in memory caching for database queries",
			State:       FeatureStateAlpha,
		},
		{
			Name:         "newPanelChromeUI",
			Description:  "Show updated look and feel of grafana-ui PanelChrome: panel header, icons, and menu",
			State:        FeatureStateAlpha,
			FrontendOnly: true,
		},
		{
			Name:            "queryLibrary",
			Description:     "Reusable query library",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:        "showDashboardValidationWarnings",
			Description: "Show warnings when dashboards do not validate against the schema",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "mysqlAnsiQuotes",
			Description: "Use double quotes to escape keyword in a MySQL query",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "userRemoteCache",
			Description: "Enable using remote cache for users",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "datasourceLogger",
			Description: "Logs all datasource requests",
			State:       FeatureStateBeta,
		},
		{
			Name:            "accessControlOnCall",
			Description:     "Access control primitives for OnCall",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:            "nestedFolders",
			Description:     "Enable folder nesting",
			State:           FeatureStateAlpha,
			RequiresDevMode: true,
		},
		{
			Name:        "accessTokenExpirationCheck",
			Description: "Enable OAuth access_token expiration check and token refresh using the refresh_token",
			State:       FeatureStateStable,
		},
		{
			Name:        "elasticsearchBackendMigration",
			Description: "Use Elasticsearch as backend data source",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "secureSocksDatasourceProxy",
			Description: "Enable secure socks tunneling for supported core datasources",
			State:       FeatureStateAlpha,
		},
		{
			Name:        "authnService",
			Description: "Use new auth service to perform authentication",
			State:       FeatureStateAlpha,
		},
	}
)
