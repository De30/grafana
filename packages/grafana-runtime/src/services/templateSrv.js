"use strict";
exports.__esModule = true;
exports.getTemplateSrv = exports.setTemplateSrv = void 0;
var singletonInstance;
/**
 * Used during startup by Grafana to set the TemplateSrv so it is available
 * via the {@link getTemplateSrv} to the rest of the application.
 *
 * @internal
 */
var setTemplateSrv = function (instance) {
    singletonInstance = instance;
};
exports.setTemplateSrv = setTemplateSrv;
/**
 * Used to retrieve the {@link TemplateSrv} that can be used to fetch available
 * template variables.
 *
 * @public
 */
var getTemplateSrv = function () { return singletonInstance; };
exports.getTemplateSrv = getTemplateSrv;
