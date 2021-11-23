global.t = {
  setAttribute: () => ({}),
};
global.tag = {
  setAttribute: () => ({}),
};
global.window = {};
global.document = {
  createElement: () => ({}),
  querySelectorAll: () => ({}),
};

var a = require('./dist/index.production.js');
console.log('EXPORTED API');
console.log('-----------------------------');
console.log('Number of exports: ', Object.keys(a).length);
