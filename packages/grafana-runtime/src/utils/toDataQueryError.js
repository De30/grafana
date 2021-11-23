"use strict";
exports.__esModule = true;
exports.toDataQueryError = void 0;
/**
 * Convert an object into a DataQueryError -- if this is an HTTP response,
 * it will put the correct values in the error field
 *
 * @public
 */
function toDataQueryError(err) {
    var error = (err || {});
    if (!error.message) {
        if (typeof err === 'string' || err instanceof String) {
            return { message: err };
        }
        var message = 'Query error';
        if (error.message) {
            message = error.message;
        }
        else if (error.data && error.data.message) {
            message = error.data.message;
        }
        else if (error.data && error.data.error) {
            message = error.data.error;
        }
        else if (error.status) {
            message = "Query error: " + error.status + " " + error.statusText;
        }
        error.message = message;
    }
    return error;
}
exports.toDataQueryError = toDataQueryError;
