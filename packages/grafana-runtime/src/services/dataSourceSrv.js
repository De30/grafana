"use strict";
exports.__esModule = true;
exports.getDataSourceSrv = exports.setDataSourceSrv = void 0;
var singletonInstance;
/**
 * Used during startup by Grafana to set the DataSourceSrv so it is available
 * via the {@link getDataSourceSrv} to the rest of the application.
 *
 * @internal
 */
function setDataSourceSrv(instance) {
    singletonInstance = instance;
}
exports.setDataSourceSrv = setDataSourceSrv;
/**
 * Used to retrieve the {@link DataSourceSrv} that is the entry point for communicating with
 * a datasource that is added as a plugin (both external and internal).
 *
 * @public
 */
function getDataSourceSrv() {
    return singletonInstance;
}
exports.getDataSourceSrv = getDataSourceSrv;
