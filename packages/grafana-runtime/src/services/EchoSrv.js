"use strict";
exports.__esModule = true;
exports.registerEchoBackend = exports.getEchoSrv = exports.setEchoSrv = exports.EchoEventType = void 0;
/**
 * Supported echo event types that can be sent via the {@link EchoSrv}.
 *
 * @public
 */
var EchoEventType;
(function (EchoEventType) {
    EchoEventType["Performance"] = "performance";
    EchoEventType["MetaAnalytics"] = "meta-analytics";
    EchoEventType["Sentry"] = "sentry";
    EchoEventType["Pageview"] = "pageview";
    EchoEventType["Interaction"] = "interaction";
})(EchoEventType = exports.EchoEventType || (exports.EchoEventType = {}));
var singletonInstance;
/**
 * Used during startup by Grafana to set the EchoSrv so it is available
 * via the {@link getEchoSrv} to the rest of the application.
 *
 * @internal
 */
function setEchoSrv(instance) {
    singletonInstance = instance;
}
exports.setEchoSrv = setEchoSrv;
/**
 * Used to retrieve the {@link EchoSrv} that can be used to report events to registered
 * echo backends.
 *
 * @public
 */
function getEchoSrv() {
    return singletonInstance;
}
exports.getEchoSrv = getEchoSrv;
/**
 * Used to register echo backends that will receive Grafana echo events during application
 * runtime.
 *
 * @public
 */
var registerEchoBackend = function (backend) {
    getEchoSrv().addBackend(backend);
};
exports.registerEchoBackend = registerEchoBackend;
