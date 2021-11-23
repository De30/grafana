"use strict";
exports.__esModule = true;
exports.getLocationSrv = exports.setLocationSrv = void 0;
var singletonInstance;
/**
 * Used during startup by Grafana to set the LocationSrv so it is available
 * via the {@link getLocationSrv} to the rest of the application.
 *
 * @internal
 */
function setLocationSrv(instance) {
    singletonInstance = instance;
}
exports.setLocationSrv = setLocationSrv;
/**
 * Used to retrieve the {@link LocationSrv} that can be used to automatically navigate
 * the user to a new place in Grafana.
 *
 * @public
 */
function getLocationSrv() {
    return singletonInstance;
}
exports.getLocationSrv = getLocationSrv;
