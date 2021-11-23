"use strict";
exports.__esModule = true;
exports.getAngularLoader = exports.setAngularLoader = void 0;
var instance;
/**
 * Used during startup by Grafana to set the AngularLoader so it is available
 * via the {@link getAngularLoader} to the rest of the application.
 *
 * @internal
 */
function setAngularLoader(v) {
    instance = v;
}
exports.setAngularLoader = setAngularLoader;
/**
 * Used to retrieve the {@link AngularLoader} that enables the use of Angular
 * components within a React component.
 *
 * Please see the {@link AngularComponent} for a proper example.
 *
 * @public
 */
function getAngularLoader() {
    return instance;
}
exports.getAngularLoader = getAngularLoader;
