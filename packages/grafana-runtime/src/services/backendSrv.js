"use strict";
exports.__esModule = true;
exports.getBackendSrv = exports.setBackendSrv = void 0;
var singletonInstance;
/**
 * Used during startup by Grafana to set the BackendSrv so it is available
 * via the {@link getBackendSrv} to the rest of the application.
 *
 * @internal
 */
var setBackendSrv = function (instance) {
    singletonInstance = instance;
};
exports.setBackendSrv = setBackendSrv;
/**
 * Used to retrieve the {@link BackendSrv} that can be used to communicate
 * via http(s) to a remote backend such as the Grafana backend, a datasource etc.
 *
 * @public
 */
var getBackendSrv = function () { return singletonInstance; };
exports.getBackendSrv = getBackendSrv;
