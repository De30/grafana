"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.navigationLogger = exports.setLocationService = exports.locationService = exports.locationSearchToObject = exports.HistoryWrapper = void 0;
var data_1 = require("@grafana/data");
var H = require("history");
var ui_1 = require("@grafana/ui");
var config_1 = require("../config");
/** @internal */
var HistoryWrapper = /** @class */ (function () {
    function HistoryWrapper(history) {
        var _a;
        // If no history passed create an in memory one if being called from test
        this.history =
            history ||
                (process.env.NODE_ENV === 'test'
                    ? H.createMemoryHistory({ initialEntries: ['/'] })
                    : H.createBrowserHistory({ basename: (_a = config_1.config.appSubUrl) !== null && _a !== void 0 ? _a : '/' }));
        this.partial = this.partial.bind(this);
        this.push = this.push.bind(this);
        this.replace = this.replace.bind(this);
        this.getSearch = this.getSearch.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.getLocation = this.getLocation.bind(this);
    }
    HistoryWrapper.prototype.getHistory = function () {
        return this.history;
    };
    HistoryWrapper.prototype.getSearch = function () {
        return new URLSearchParams(this.history.location.search);
    };
    HistoryWrapper.prototype.partial = function (query, replace) {
        var currentLocation = this.history.location;
        var newQuery = this.getSearchObject();
        for (var _i = 0, _a = Object.keys(query); _i < _a.length; _i++) {
            var key = _a[_i];
            // removing params with null | undefined
            if (query[key] === null || query[key] === undefined) {
                delete newQuery[key];
            }
            else {
                newQuery[key] = query[key];
            }
        }
        var updatedUrl = data_1.urlUtil.renderUrl(currentLocation.pathname, newQuery);
        if (replace) {
            this.history.replace(updatedUrl, this.history.location.state);
        }
        else {
            this.history.push(updatedUrl, this.history.location.state);
        }
    };
    HistoryWrapper.prototype.push = function (location) {
        this.history.push(location);
    };
    HistoryWrapper.prototype.replace = function (location) {
        this.history.replace(location);
    };
    HistoryWrapper.prototype.reload = function () {
        var _a;
        var prevState = (_a = this.history.location.state) === null || _a === void 0 ? void 0 : _a.routeReloadCounter;
        this.history.replace(__assign(__assign({}, this.history.location), { state: { routeReloadCounter: prevState ? prevState + 1 : 1 } }));
    };
    HistoryWrapper.prototype.getLocation = function () {
        return this.history.location;
    };
    HistoryWrapper.prototype.getSearchObject = function () {
        return locationSearchToObject(this.history.location.search);
    };
    /** @deprecated use partial, push or replace instead */
    HistoryWrapper.prototype.update = function (options) {
        (0, data_1.deprecationWarning)('LocationSrv', 'update', 'partial, push or replace');
        if (options.partial && options.query) {
            this.partial(options.query, options.partial);
        }
        else {
            var newLocation = {
                pathname: options.path
            };
            if (options.query) {
                newLocation.search = data_1.urlUtil.toUrlParams(options.query);
            }
            if (options.replace) {
                this.replace(newLocation);
            }
            else {
                this.push(newLocation);
            }
        }
    };
    return HistoryWrapper;
}());
exports.HistoryWrapper = HistoryWrapper;
/**
 * @alpha
 * Parses a location search string to an object
 * */
function locationSearchToObject(search) {
    var queryString = typeof search === 'number' ? String(search) : search;
    if (queryString.length > 0) {
        if (queryString.startsWith('?')) {
            return data_1.urlUtil.parseKeyValue(queryString.substring(1));
        }
        return data_1.urlUtil.parseKeyValue(queryString);
    }
    return {};
}
exports.locationSearchToObject = locationSearchToObject;
/**
 * @alpha
 */
exports.locationService = new HistoryWrapper();
/** @internal
 * Used for tests only
 */
var setLocationService = function (location) {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('locationService can be only overriden in test environment');
    }
    exports.locationService = location;
};
exports.setLocationService = setLocationService;
var navigationLog = (0, ui_1.createLogger)('Router');
/** @internal */
exports.navigationLogger = navigationLog.logger;
// For debugging purposes the location service is attached to global _debug variable
(0, ui_1.attachDebugger)('location', exports.locationService, navigationLog);
