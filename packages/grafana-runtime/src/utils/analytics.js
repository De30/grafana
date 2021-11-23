"use strict";
exports.__esModule = true;
exports.reportInteraction = exports.reportPageview = exports.reportMetaAnalytics = void 0;
var EchoSrv_1 = require("../services/EchoSrv");
var services_1 = require("../services");
var config_1 = require("../config");
/**
 * Helper function to report meta analytics to the {@link EchoSrv}.
 *
 * @public
 */
var reportMetaAnalytics = function (payload) {
    (0, EchoSrv_1.getEchoSrv)().addEvent({
        type: EchoSrv_1.EchoEventType.MetaAnalytics,
        payload: payload
    });
};
exports.reportMetaAnalytics = reportMetaAnalytics;
/**
 * Helper function to report pageview events to the {@link EchoSrv}.
 *
 * @public
 */
var reportPageview = function () {
    var _a;
    var location = services_1.locationService.getLocation();
    var page = "" + ((_a = config_1.config.appSubUrl) !== null && _a !== void 0 ? _a : '') + location.pathname + location.search + location.hash;
    (0, EchoSrv_1.getEchoSrv)().addEvent({
        type: EchoSrv_1.EchoEventType.Pageview,
        payload: {
            page: page
        }
    });
};
exports.reportPageview = reportPageview;
/**
 * Helper function to report interaction events to the {@link EchoSrv}.
 *
 * @public
 */
var reportInteraction = function (interactionName, properties) {
    (0, EchoSrv_1.getEchoSrv)().addEvent({
        type: EchoSrv_1.EchoEventType.Interaction,
        payload: {
            interactionName: interactionName,
            properties: properties
        }
    });
};
exports.reportInteraction = reportInteraction;
