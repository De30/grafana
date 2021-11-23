"use strict";
exports.__esModule = true;
exports.logError = exports.logDebug = exports.logWarning = exports.logInfo = exports.LogLevel = void 0;
var browser_1 = require("@sentry/browser");
exports.LogLevel = browser_1.Severity;
/**
 * Log a message at INFO level. Depending on configuration might be forwarded to backend and logged to stdout or sent to Sentry
 *
 * @public
 */
function logInfo(message, contexts) {
    (0, browser_1.captureMessage)(message, {
        level: browser_1.Severity.Info,
        contexts: contexts
    });
}
exports.logInfo = logInfo;
/**
 * Log a message at WARNING level. Depending on configuration might be forwarded to backend and logged to stdout or sent to Sentry
 *
 * @public
 */
function logWarning(message, contexts) {
    (0, browser_1.captureMessage)(message, {
        level: browser_1.Severity.Warning,
        contexts: contexts
    });
}
exports.logWarning = logWarning;
/**
 * Log a message at DEBUG level. Depending on configuration might be forwarded to backend and logged to stdout or sent to Sentry
 *
 * @public
 */
function logDebug(message, contexts) {
    (0, browser_1.captureMessage)(message, {
        level: browser_1.Severity.Debug,
        contexts: contexts
    });
}
exports.logDebug = logDebug;
/**
 * Log an error. Depending on configuration might be forwarded to backend and logged to stdout or sent to Sentry
 *
 * @public
 */
function logError(err, contexts) {
    (0, browser_1.captureException)(err, { contexts: contexts });
}
exports.logError = logError;
