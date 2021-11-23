"use strict";
exports.__esModule = true;
exports.isInteractionEvent = exports.isPageviewEvent = exports.MetaAnalyticsEventName = void 0;
/**
 * The meta analytics events that can be added to the echo service.
 *
 * @public
 */
var MetaAnalyticsEventName;
(function (MetaAnalyticsEventName) {
    MetaAnalyticsEventName["DashboardView"] = "dashboard-view";
    MetaAnalyticsEventName["DataRequest"] = "data-request";
})(MetaAnalyticsEventName = exports.MetaAnalyticsEventName || (exports.MetaAnalyticsEventName = {}));
/**
 * Pageview event typeguard.
 *
 * @public
 */
var isPageviewEvent = function (event) {
    return Boolean(event.payload.page);
};
exports.isPageviewEvent = isPageviewEvent;
/**
 * Interaction event typeguard.
 *
 * @public
 */
var isInteractionEvent = function (event) {
    return Boolean(event.payload.interactionName);
};
exports.isInteractionEvent = isInteractionEvent;
