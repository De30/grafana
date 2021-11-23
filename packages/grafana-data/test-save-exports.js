const fs = require('fs');
const path = require('path');

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

var a = require('./dist/index.js');
console.log('EXPORTED API');
console.log('-----------------------------');
console.log('Number of exports: ', Object.keys(a).length);
fs.writeFileSync(path.join(__dirname, 'test-exports.json'), JSON.stringify(Object.keys(a), null, 4));
