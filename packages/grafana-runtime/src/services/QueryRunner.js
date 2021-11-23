"use strict";
exports.__esModule = true;
exports.createQueryRunner = exports.setQueryRunnerFactory = void 0;
var factory;
/**
 * Used to bootstrap the {@link createQueryRunner} during application start.
 *
 * @internal
 */
var setQueryRunnerFactory = function (instance) {
    if (factory) {
        throw new Error('Runner should only be set when Grafana is starting.');
    }
    factory = instance;
};
exports.setQueryRunnerFactory = setQueryRunnerFactory;
/**
 * Used to create QueryRunner instances from outside the core Grafana application.
 * This is helpful to be able to create a QueryRunner to execute queries in e.g. an app plugin.
 *
 * @internal
 */
var createQueryRunner = function () {
    if (!factory) {
        throw new Error('`createQueryRunner` can only be used after Grafana instance has started.');
    }
    return factory();
};
exports.createQueryRunner = createQueryRunner;
