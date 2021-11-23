const astExports = require('./test-ast-exports.json');
const normalExports = require('./test-exports.json');

const onlyInAstExports = astExports.filter((x) => !normalExports.includes(x));
const onlyInNormalExports = normalExports.filter((x) => !astExports.includes(x));

console.log('');
console.log(`Only in AST exports (${astExports.length} exports):`);
console.log('--------------------');
console.log('');
console.log(JSON.stringify(onlyInAstExports, null, 4));

console.log('');
console.log(`Only in normal exports (${normalExports.length} exports):`);
console.log('--------------------');
console.log('');
console.log(JSON.stringify(onlyInNormalExports, null, 4));
