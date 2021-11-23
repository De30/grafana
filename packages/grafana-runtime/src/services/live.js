"use strict";
exports.__esModule = true;
exports.getGrafanaLiveSrv = exports.setGrafanaLiveSrv = void 0;
var singletonInstance;
/**
 * Used during startup by Grafana to set the GrafanaLiveSrv so it is available
 * via the {@link getGrafanaLiveSrv} to the rest of the application.
 *
 * @internal
 */
var setGrafanaLiveSrv = function (instance) {
    singletonInstance = instance;
};
exports.setGrafanaLiveSrv = setGrafanaLiveSrv;
/**
 * Used to retrieve the GrafanaLiveSrv that allows you to subscribe to
 * server side events and streams
 *
 * @alpha -- experimental
 */
var getGrafanaLiveSrv = function () { return singletonInstance; };
exports.getGrafanaLiveSrv = getGrafanaLiveSrv;
