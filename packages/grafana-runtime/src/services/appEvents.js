"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.getAppEvents = exports.setAppEvents = exports.CopyPanelEvent = exports.TimeRangeUpdatedEvent = exports.ThemeChangedEvent = exports.RefreshEvent = void 0;
var data_1 = require("@grafana/data");
/**
 * Called when a dashboard is refreshed
 *
 * @public
 */
var RefreshEvent = /** @class */ (function (_super) {
    __extends(RefreshEvent, _super);
    function RefreshEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RefreshEvent.type = 'refresh';
    return RefreshEvent;
}(data_1.BusEventBase));
exports.RefreshEvent = RefreshEvent;
/**
 * Called when the theme settings change
 *
 * @public
 */
var ThemeChangedEvent = /** @class */ (function (_super) {
    __extends(ThemeChangedEvent, _super);
    function ThemeChangedEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ThemeChangedEvent.type = 'theme-changed';
    return ThemeChangedEvent;
}(data_1.BusEventWithPayload));
exports.ThemeChangedEvent = ThemeChangedEvent;
/**
 * Called when time range is updated
 *
 * @public
 */
var TimeRangeUpdatedEvent = /** @class */ (function (_super) {
    __extends(TimeRangeUpdatedEvent, _super);
    function TimeRangeUpdatedEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TimeRangeUpdatedEvent.type = 'time-range-updated';
    return TimeRangeUpdatedEvent;
}(data_1.BusEventWithPayload));
exports.TimeRangeUpdatedEvent = TimeRangeUpdatedEvent;
/**
 * Called to copy a panel JSON into local storage
 *
 * @public
 */
var CopyPanelEvent = /** @class */ (function (_super) {
    __extends(CopyPanelEvent, _super);
    function CopyPanelEvent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CopyPanelEvent.type = 'copy-panel';
    return CopyPanelEvent;
}(data_1.BusEventWithPayload));
exports.CopyPanelEvent = CopyPanelEvent;
// Internal singleton instance
var singletonInstance;
/**
 * Used during startup by Grafana to set the LocationSrv so it is available
 * via the {@link getLocationSrv} to the rest of the application.
 *
 * @internal
 */
function setAppEvents(instance) {
    singletonInstance = instance;
}
exports.setAppEvents = setAppEvents;
/**
 * Used to retrieve an event bus that manages application level events
 *
 * @public
 */
function getAppEvents() {
    return singletonInstance;
}
exports.getAppEvents = getAppEvents;
