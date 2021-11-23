"use strict";
exports.__esModule = true;
exports.loadPluginCss = exports.SystemJS = void 0;
var config_1 = require("../config");
// @ts-ignore
var system_js_1 = require("systemjs/dist/system.js");
/**
 * @internal
 */
exports.SystemJS = system_js_1["default"];
/**
 * Use this to load css for a Grafana plugin by specifying a {@link PluginCssOptions}
 * containing styling for the dark and the light theme.
 *
 * @param options - plugin styling for light and dark theme.
 * @public
 */
function loadPluginCss(options) {
    var theme = config_1.config.bootData.user.lightTheme ? options.light : options.dark;
    return exports.SystemJS["import"](theme + "!css");
}
exports.loadPluginCss = loadPluginCss;
