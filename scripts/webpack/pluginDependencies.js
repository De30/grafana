// Module Federation PoC
// This file does that same thing as `exposeToPlugin` does in `public/app/features/plugins/plugin_loader.ts`
// for Federated Modules.
const packageJSON = require('../../package.json');

const deps = packageJSON.dependencies;
const listOfDepsToExpose = [
  '@emotion/css',
  '@emotion/react',
  '@grafana/slate-react',
  'd3',
  'jquery',
  'lodash',
  'moment',
  'prismjs',
  'react-dom',
  'react-redux',
  'react-router-dom',
  'react',
  'redux',
  'rxjs',
  'rxjs/operators',
  'slate-plain-serializer',
  'slate',
];

const exposedDependencies = Object.keys(deps)
  .filter((key) => listOfDepsToExpose.includes(key))
  .reduce((acc, key) => {
    return {
      ...acc,
      [key]: {
        singleton: true, // For now we force plugins to use the runtime versions core depends on
        requiredVersion: `^${deps[key]}`,
      },
    };
  }, {});

const grafanaDependencies = {
  '@grafana/data': {
    singleton: true,
    requiredVersion: `^${packageJSON.version}`,
  },
  '@grafana/e2e-selectors': {
    singleton: true,
    requiredVersion: `^${packageJSON.version}`,
  },
  '@grafana/runtime': {
    singleton: true,
    requiredVersion: `^${packageJSON.version}`,
  },
  '@grafana/schema': {
    singleton: true,
    requiredVersion: `^${packageJSON.version}`,
  },
  '@grafana/ui': {
    singleton: true,
    requiredVersion: `^${packageJSON.version}`,
  },
};

const pluginDependencies = {
  ...exposedDependencies,
  ...grafanaDependencies,
};

module.exports = pluginDependencies;
