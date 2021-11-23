"use strict";
exports.__esModule = true;
exports.config = exports.GrafanaBootConfig = void 0;
var lodash_1 = require("lodash");
var data_1 = require("@grafana/data");
var GrafanaBootConfig = /** @class */ (function () {
    function GrafanaBootConfig(options) {
        this.datasources = {};
        this.panels = {};
        this.minRefreshInterval = '';
        this.appUrl = '';
        this.appSubUrl = '';
        this.windowTitlePrefix = '';
        this.buildInfo = {};
        this.newPanelTitle = '';
        this.externalUserMngLinkUrl = '';
        this.externalUserMngLinkName = '';
        this.externalUserMngInfo = '';
        this.allowOrgCreate = false;
        this.disableLoginForm = false;
        this.defaultDatasource = ''; // UID
        this.alertingEnabled = false;
        this.alertingErrorOrTimeout = '';
        this.alertingNoDataOrNullValues = '';
        this.alertingMinInterval = 1;
        this.authProxyEnabled = false;
        this.exploreEnabled = false;
        this.ldapEnabled = false;
        this.sigV4AuthEnabled = false;
        this.samlEnabled = false;
        this.samlName = '';
        this.autoAssignOrg = true;
        this.verifyEmailEnabled = false;
        this.disableUserSignUp = false;
        this.viewersCanEdit = false;
        this.editorsCanAdmin = false;
        this.disableSanitizeHtml = false;
        this.liveEnabled = true;
        this.pluginsToPreload = [];
        this.featureToggles = {
            accesscontrol: false,
            trimDefaults: false,
            tempoServiceGraph: false,
            tempoSearch: false,
            recordedQueries: false,
            newNavigation: false,
            fullRangeLogsVolume: false
        };
        this.licenseInfo = {};
        this.rendererAvailable = false;
        this.rendererVersion = '';
        this.http2Enabled = false;
        this.sentry = {
            enabled: false,
            dsn: '',
            customEndpoint: '',
            sampleRate: 1
        };
        this.pluginCatalogURL = 'https://grafana.com/grafana/plugins/';
        this.pluginAdminEnabled = true;
        this.pluginAdminExternalManageEnabled = false;
        this.pluginCatalogHiddenPlugins = [];
        this.expressionsEnabled = false;
        this.awsAllowedAuthProviders = [];
        this.awsAssumeRoleEnabled = false;
        this.azure = {
            managedIdentityEnabled: false
        };
        this.caching = {
            enabled: false
        };
        this.unifiedAlertingEnabled = false;
        this.recordedQueries = {
            enabled: false
        };
        var mode = options.bootData.user.lightTheme ? 'light' : 'dark';
        this.theme2 = (0, data_1.createTheme)({ colors: { mode: mode } });
        this.theme = this.theme2.v1;
        var defaults = {
            datasources: {},
            windowTitlePrefix: 'Grafana - ',
            panels: {},
            newPanelTitle: 'Panel Title',
            playlist_timespan: '1m',
            unsaved_changes_warning: true,
            appUrl: '',
            appSubUrl: '',
            buildInfo: {
                version: 'v1.0',
                commit: '1',
                env: 'production',
                isEnterprise: false
            },
            viewersCanEdit: false,
            editorsCanAdmin: false,
            disableSanitizeHtml: false
        };
        (0, lodash_1.merge)(this, defaults, options);
        if (this.dateFormats) {
            data_1.systemDateFormats.update(this.dateFormats);
        }
    }
    return GrafanaBootConfig;
}());
exports.GrafanaBootConfig = GrafanaBootConfig;
var bootData = window.grafanaBootData || {
    settings: {},
    user: {},
    navTree: []
};
var options = bootData.settings;
options.bootData = bootData;
/**
 * Use this to access the {@link GrafanaBootConfig} for the current running Grafana instance.
 *
 * @public
 */
exports.config = new GrafanaBootConfig(options);
