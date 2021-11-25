"use strict";
exports.__esModule = true;
var ts = require("typescript");
var imports = [];
run();
function run() {
    var file = process.argv.slice(2)[0];
    getImports(file);
    var imports2 = imports.reduce(function (prev, curr) {
        curr.namedImports.map(function (namedImport) {
            if (prev[namedImport]) {
                prev[namedImport] += 1;
            }
            else {
                prev[namedImport] = 1;
            }
        });
        return prev;
    }, {});
    console.log(JSON.stringify(imports2, null, 4));
}
function getImports(fileName) {
    var moduleName = '@grafana/runtime';
    var program = ts.createProgram([fileName], { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS });
    var checker = program.getTypeChecker();
    var allExports = {};
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        // console.log(sourceFile.fileName);
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
    }
    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            var importObj = {
                "import": node.getText(),
                from: node.moduleSpecifier.getText().replace(/'/g, '').replace(/"/g, ''),
                namedImports: node.importClause.namedBindings && node.importClause.namedBindings.elements
                    ? node.importClause.namedBindings.elements.map(function (e) { return e.getText(); })
                    : []
            };
            if (importObj.from.includes(moduleName)) {
                imports.push(importObj);
            }
            imports.push();
        }
        else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }
}
