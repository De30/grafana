"use strict";
exports.__esModule = true;
exports.frameToMetricFindValue = exports.toTestingStatus = exports.toDataQueryResponse = void 0;
var data_1 = require("@grafana/data");
var toDataQueryError_1 = require("./toDataQueryError");
/**
 * Parse the results from /api/ds/query into a DataQueryResponse
 *
 * @param res - the HTTP response data.
 * @param queries - optional DataQuery array that will order the response based on the order of query refId's.
 *
 * @public
 */
function toDataQueryResponse(res, queries) {
    var _a, _b, _c, _d;
    var rsp = { data: [], state: data_1.LoadingState.Done };
    // If the response isn't in a correct shape we just ignore the data and pass empty DataQueryResponse.
    if ((_a = res.data) === null || _a === void 0 ? void 0 : _a.results) {
        var results = res.data.results;
        var refIDs = (queries === null || queries === void 0 ? void 0 : queries.length) ? queries.map(function (q) { return q.refId; }) : Object.keys(results);
        var data = [];
        for (var _i = 0, refIDs_1 = refIDs; _i < refIDs_1.length; _i++) {
            var refId = refIDs_1[_i];
            var dr = results[refId];
            if (!dr) {
                continue;
            }
            dr.refId = refId;
            data.push(dr);
        }
        for (var _e = 0, data_2 = data; _e < data_2.length; _e++) {
            var dr = data_2[_e];
            if (dr.error) {
                if (!rsp.error) {
                    rsp.error = {
                        refId: dr.refId,
                        message: dr.error
                    };
                    rsp.state = data_1.LoadingState.Error;
                }
            }
            if ((_b = dr.frames) === null || _b === void 0 ? void 0 : _b.length) {
                for (var _f = 0, _g = dr.frames; _f < _g.length; _f++) {
                    var js = _g[_f];
                    var df = (0, data_1.dataFrameFromJSON)(js);
                    if (!df.refId) {
                        df.refId = dr.refId;
                    }
                    rsp.data.push(df);
                }
                continue; // the other tests are legacy
            }
            if ((_c = dr.series) === null || _c === void 0 ? void 0 : _c.length) {
                for (var _h = 0, _j = dr.series; _h < _j.length; _h++) {
                    var s = _j[_h];
                    if (!s.refId) {
                        s.refId = dr.refId;
                    }
                    rsp.data.push((0, data_1.toDataFrame)(s));
                }
            }
            if ((_d = dr.tables) === null || _d === void 0 ? void 0 : _d.length) {
                for (var _k = 0, _l = dr.tables; _k < _l.length; _k++) {
                    var s = _l[_k];
                    if (!s.refId) {
                        s.refId = dr.refId;
                    }
                    rsp.data.push((0, data_1.toDataFrame)(s));
                }
            }
        }
    }
    // When it is not an OK response, make sure the error gets added
    if (res.status && res.status !== 200) {
        if (rsp.state !== data_1.LoadingState.Error) {
            rsp.state = data_1.LoadingState.Error;
        }
        if (!rsp.error) {
            rsp.error = (0, toDataQueryError_1.toDataQueryError)(res);
        }
    }
    return rsp;
}
exports.toDataQueryResponse = toDataQueryResponse;
/**
 * Data sources using api/ds/query to test data sources can use this function to
 * handle errors and convert them to TestingStatus object.
 *
 * If possible, this should be avoided in favor of implementing /health endpoint
 * and testing data source with DataSourceWithBackend.testDataSource()
 *
 * Re-thrown errors are handled by testDataSource() in public/app/features/datasources/state/actions.ts
 *
 * @returns {TestingStatus}
 */
function toTestingStatus(err) {
    var _a, _b, _c, _d, _e, _f;
    var queryResponse = toDataQueryResponse(err);
    // POST api/ds/query errors returned as { message: string, error: string } objects
    if ((_b = (_a = queryResponse.error) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) {
        return {
            status: 'error',
            message: queryResponse.error.data.message,
            details: ((_d = (_c = queryResponse.error) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) ? { message: queryResponse.error.data.error } : undefined
        };
    }
    // POST api/ds/query errors returned in results object
    else if (((_e = queryResponse.error) === null || _e === void 0 ? void 0 : _e.refId) && ((_f = queryResponse.error) === null || _f === void 0 ? void 0 : _f.message)) {
        return {
            status: 'error',
            message: queryResponse.error.message
        };
    }
    throw err;
}
exports.toTestingStatus = toTestingStatus;
/**
 * Return the first string or non-time field as the value
 *
 * @beta
 */
function frameToMetricFindValue(frame) {
    if (!frame || !frame.length) {
        return [];
    }
    var values = [];
    var field = frame.fields.find(function (f) { return f.type === data_1.FieldType.string; });
    if (!field) {
        field = frame.fields.find(function (f) { return f.type !== data_1.FieldType.time; });
    }
    if (field) {
        for (var i = 0; i < field.values.length; i++) {
            values.push({ text: '' + field.values.get(i) });
        }
    }
    return values;
}
exports.frameToMetricFindValue = frameToMetricFindValue;
