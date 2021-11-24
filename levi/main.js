"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var ts = require("typescript");
var debug_1 = require("debug");
var debug = (0, debug_1["default"])('compare');
run();
function run() {
    var _a = process.argv.slice(2), oldFile = _a[0], newFile = _a[1];
    compareExports(oldFile, newFile);
}
function compareExports(oldFile, newFile) {
    debug('Old filename: %o', oldFile);
    debug('New filename: %o', newFile);
    var oldFileExports = getAllExports(oldFile);
    var newFileExports = getAllExports(newFile);
    var additions = {};
    var removals = {};
    var changes = {};
    debug('Old file: %o exports', Object.keys(oldFileExports).length);
    debug('New file: %o exports', Object.keys(newFileExports).length);
    // Look for additions and changes
    for (var _i = 0, _a = Object.entries(newFileExports); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        // Addition
        if (!oldFileExports[key]) {
            additions[key] = value;
            // Change
        }
        else {
            //
        }
    }
    // Look for removals
    for (var _c = 0, _d = Object.entries(oldFileExports); _c < _d.length; _c++) {
        var _e = _d[_c], key = _e[0], value = _e[1];
        // Removal
        if (!newFileExports[key]) {
            removals[key] = value;
        }
    }
    console.log('');
    console.log('ADDITIONS:', Object.keys(additions));
    console.log('CHANGES:', Object.keys(changes));
    console.log('REMOVALS:', Object.keys(removals));
}
function getAllExports(fileName) {
    var program = ts.createProgram([fileName], { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS });
    var checker = program.getTypeChecker();
    var allExports = {};
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        var fileSymbol = checker.getSymbolAtLocation(sourceFile);
        var fileExports = getFileSymbolExports(fileSymbol);
        allExports = __assign(__assign({}, allExports), fileExports);
    }
    return allExports;
}
function getFileSymbolExports(file) {
    var fileExports = {};
    if (file === null || file === void 0 ? void 0 : file.exports) {
        file.exports.forEach(function (value, key) {
            if (key && key !== '__export') {
                fileExports[key] = value;
            }
        });
    }
    return fileExports;
}
