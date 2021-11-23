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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.DataSourceWithBackend = exports.standardStreamOptionsProvider = exports.toStreamingDataResponse = exports.HealthStatus = exports.isExpressionReference = exports.ExpressionDatasourceRef = void 0;
var data_1 = require("@grafana/data");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var services_1 = require("../services");
var queryResponse_1 = require("./queryResponse");
/**
 * @internal
 */
exports.ExpressionDatasourceRef = Object.freeze({
    type: '__expr__',
    uid: '__expr__'
});
/**
 * @internal
 */
function isExpressionReference(ref) {
    var _a;
    if (!ref) {
        return false;
    }
    var v = (_a = ref.type) !== null && _a !== void 0 ? _a : ref;
    return v === exports.ExpressionDatasourceRef.type || v === '-100'; // -100 was a legacy accident that should be removed
}
exports.isExpressionReference = isExpressionReference;
var HealthCheckError = /** @class */ (function (_super) {
    __extends(HealthCheckError, _super);
    function HealthCheckError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.details = details;
        _this.name = 'HealthCheckError';
        return _this;
    }
    return HealthCheckError;
}(Error));
/**
 * Describes the current health status of a data source plugin.
 *
 * @public
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["Unknown"] = "UNKNOWN";
    HealthStatus["OK"] = "OK";
    HealthStatus["Error"] = "ERROR";
})(HealthStatus = exports.HealthStatus || (exports.HealthStatus = {}));
/**
 * Extend this class to implement a data source plugin that is depending on the Grafana
 * backend API.
 *
 * @public
 */
var DataSourceWithBackend = /** @class */ (function (_super) {
    __extends(DataSourceWithBackend, _super);
    function DataSourceWithBackend(instanceSettings) {
        var _this = _super.call(this, instanceSettings) || this;
        /**
         * Optionally override the streaming behavior
         */
        _this.streamOptionsProvider = exports.standardStreamOptionsProvider;
        return _this;
    }
    /**
     * Ideally final -- any other implementation may not work as expected
     */
    DataSourceWithBackend.prototype.query = function (request) {
        var _this = this;
        var intervalMs = request.intervalMs, maxDataPoints = request.maxDataPoints, range = request.range, requestId = request.requestId;
        var targets = request.targets;
        if (this.filterQuery) {
            targets = targets.filter(function (q) { return _this.filterQuery(q); });
        }
        var queries = targets.map(function (q) {
            var _a;
            var datasource = _this.getRef();
            var datasourceId = _this.id;
            if (isExpressionReference(q.datasource)) {
                return __assign(__assign({}, q), { datasource: exports.ExpressionDatasourceRef });
            }
            if (q.datasource) {
                var ds = (0, services_1.getDataSourceSrv)().getInstanceSettings(q.datasource);
                if (!ds) {
                    throw new Error("Unknown Datasource: " + JSON.stringify(q.datasource));
                }
                datasource = (_a = ds.rawRef) !== null && _a !== void 0 ? _a : (0, data_1.getDataSourceRef)(ds);
                datasourceId = ds.id;
            }
            return __assign(__assign({}, _this.applyTemplateVariables(q, request.scopedVars)), { datasource: datasource, datasourceId: datasourceId, // deprecated!
                intervalMs: intervalMs, maxDataPoints: maxDataPoints });
        });
        // Return early if no queries exist
        if (!queries.length) {
            return (0, rxjs_1.of)({ data: [] });
        }
        var body = { queries: queries };
        if (range) {
            body.range = range;
            body.from = range.from.valueOf().toString();
            body.to = range.to.valueOf().toString();
        }
        return (0, services_1.getBackendSrv)()
            .fetch({
            url: '/api/ds/query',
            method: 'POST',
            data: body,
            requestId: requestId
        })
            .pipe((0, operators_1.switchMap)(function (raw) {
            var _a;
            var rsp = (0, queryResponse_1.toDataQueryResponse)(raw, queries);
            // Check if any response should subscribe to a live stream
            if (((_a = rsp.data) === null || _a === void 0 ? void 0 : _a.length) && rsp.data.find(function (f) { var _a; return (_a = f.meta) === null || _a === void 0 ? void 0 : _a.channel; })) {
                return toStreamingDataResponse(rsp, request, _this.streamOptionsProvider);
            }
            return (0, rxjs_1.of)(rsp);
        }), (0, operators_1.catchError)(function (err) {
            return (0, rxjs_1.of)((0, queryResponse_1.toDataQueryResponse)(err));
        }));
    };
    /**
     * Apply template variables for explore
     */
    DataSourceWithBackend.prototype.interpolateVariablesInQueries = function (queries, scopedVars) {
        var _this = this;
        return queries.map(function (q) { return _this.applyTemplateVariables(q, scopedVars); });
    };
    /**
     * Override to apply template variables.  The result is usually also `TQuery`, but sometimes this can
     * be used to modify the query structure before sending to the backend.
     *
     * NOTE: if you do modify the structure or use template variables, alerting queries may not work
     * as expected
     *
     * @virtual
     */
    DataSourceWithBackend.prototype.applyTemplateVariables = function (query, scopedVars) {
        return query;
    };
    /**
     * Make a GET request to the datasource resource path
     */
    DataSourceWithBackend.prototype.getResource = function (path, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, services_1.getBackendSrv)().get("/api/datasources/" + this.id + "/resources/" + path, params)];
            });
        });
    };
    /**
     * Send a POST request to the datasource resource path
     */
    DataSourceWithBackend.prototype.postResource = function (path, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, services_1.getBackendSrv)().post("/api/datasources/" + this.id + "/resources/" + path, __assign({}, body))];
            });
        });
    };
    /**
     * Run the datasource healthcheck
     */
    DataSourceWithBackend.prototype.callHealthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, services_1.getBackendSrv)()
                        .request({ method: 'GET', url: "/api/datasources/" + this.id + "/health", showErrorAlert: false })
                        .then(function (v) {
                        return v;
                    })["catch"](function (err) {
                        return err.data;
                    })];
            });
        });
    };
    /**
     * Checks the plugin health
     * see public/app/features/datasources/state/actions.ts for what needs to be returned here
     */
    DataSourceWithBackend.prototype.testDatasource = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.callHealthCheck().then(function (res) {
                        if (res.status === HealthStatus.OK) {
                            return {
                                status: 'success',
                                message: res.message
                            };
                        }
                        throw new HealthCheckError(res.message, res.details);
                    })];
            });
        });
    };
    return DataSourceWithBackend;
}(data_1.DataSourceApi));
exports.DataSourceWithBackend = DataSourceWithBackend;
/**
 * @internal exported for tests
 */
function toStreamingDataResponse(rsp, req, getter) {
    var _a;
    var live = (0, services_1.getGrafanaLiveSrv)();
    if (!live) {
        return (0, rxjs_1.of)(rsp); // add warning?
    }
    var staticdata = [];
    var streams = [];
    for (var _i = 0, _b = rsp.data; _i < _b.length; _i++) {
        var f = _b[_i];
        var addr = (0, data_1.parseLiveChannelAddress)((_a = f.meta) === null || _a === void 0 ? void 0 : _a.channel);
        if (addr) {
            var frame = f;
            streams.push(live.getDataStream({
                addr: addr,
                buffer: getter(req, frame),
                frame: frame
            }));
        }
        else {
            staticdata.push(f);
        }
    }
    if (staticdata.length) {
        streams.push((0, rxjs_1.of)(__assign(__assign({}, rsp), { data: staticdata })));
    }
    if (streams.length === 1) {
        return streams[0]; // avoid merge wrapper
    }
    return rxjs_1.merge.apply(void 0, streams);
}
exports.toStreamingDataResponse = toStreamingDataResponse;
/**
 * @public
 */
var standardStreamOptionsProvider = function (request, frame) {
    var _a, _b;
    var buffer = {
        maxLength: (_a = request.maxDataPoints) !== null && _a !== void 0 ? _a : 500,
        action: data_1.StreamingFrameAction.Append
    };
    // For recent queries, clamp to the current time range
    if (((_b = request.rangeRaw) === null || _b === void 0 ? void 0 : _b.to) === 'now') {
        buffer.maxDelta = request.range.to.valueOf() - request.range.from.valueOf();
    }
    return buffer;
};
exports.standardStreamOptionsProvider = standardStreamOptionsProvider;
//@ts-ignore
exports.DataSourceWithBackend = DataSourceWithBackend = (0, data_1.makeClassES5Compatible)(DataSourceWithBackend);
