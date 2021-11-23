import * as a from './packages/grafana-runtime/dist/index.production';

console.log('EXPORTED API');
console.log('-----------------------------');
console.log('Number of exports: ', Object.keys(a).length);
