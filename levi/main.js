"use strict";
exports.__esModule = true;
var ts = require("typescript");
var fs = require("fs");
start(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});
function start(fileNames, options) {
    var program = ts.createProgram(fileNames, options);
    var checker = program.getTypeChecker();
    var allExportedNames = [];
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        var fileSymbol = checker.getSymbolAtLocation(sourceFile);
        var exportedNames = getExportedNames(fileSymbol);
        // Print to console
        if (exportedNames.length) {
            console.log(sourceFile.fileName);
            console.log(exportedNames);
        }
        allExportedNames = allExportedNames.concat(exportedNames);
    }
    fs.writeFileSync('classes.json', JSON.stringify(allExportedNames, undefined, 4));
}
function getExportedNames(fileSymbol) {
    var exportedNames = [];
    if (fileSymbol === null || fileSymbol === void 0 ? void 0 : fileSymbol.exports) {
        fileSymbol.exports.forEach(function (value, key) {
            exportedNames.push(key);
        });
    }
    return exportedNames.filter(function (n) { return n !== '__export'; });
}
