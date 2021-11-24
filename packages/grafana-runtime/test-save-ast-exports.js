const acorn = require('acorn');
const estraverse = require('estraverse');
const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname, 'dist', 'index.production.js');
const ast = acorn.parse(fs.readFileSync(filename).toString());
console.log('');
console.log('');
console.log('----------------------');
const moduleExports = [];
const moduleExportNames = new Set();

estraverse.traverse(ast, {
  enter: function (node, parent) {
    // An `export` declaration
    if (
      node.type === 'ExportDefaultDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration'
    ) {
      // We are skipping these right now
    }

    // An `exports` or `module.exports` assignment
    if (
      node.type === 'AssignmentExpression' &&
      node.operator === '=' &&
      ((node.left.object && node.left.object.name === 'exports') ||
        (node.left.object &&
          node.left.object.name === 'module' &&
          node.left.property &&
          node.left.property.name === 'exports'))
    ) {
      moduleExports.push(node);
      moduleExportNames.add(node.left.property.name);
    }
  },
});

fs.writeFileSync(path.join(__dirname, 'test-ast-exports.json'), JSON.stringify([...moduleExportNames], null, 4));
