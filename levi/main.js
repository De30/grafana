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
var oldChecker;
var newChecker;
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
    // Cache
    oldChecker = oldFileExports.checker;
    newChecker = newFileExports.checker;
    debug('Old file: %o exports', Object.keys(oldFileExports.allExports).length);
    debug('New file: %o exports', Object.keys(newFileExports.allExports).length);
    // Look for additions and changes
    for (var _i = 0, _a = Object.entries(newFileExports.allExports); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        // Addition
        if (!oldFileExports.allExports[key]) {
            additions[key] = value;
            // Change
        }
        else {
            var oldSymbol = oldFileExports.allExports[key];
            var newSymbol = value;
            if (hasChanged(oldSymbol, newSymbol)) {
                changes[key] = value;
            }
        }
    }
    // Look for removals
    for (var _c = 0, _d = Object.entries(oldFileExports.allExports); _c < _d.length; _c++) {
        var _e = _d[_c], key = _e[0], value = _e[1];
        // Removal
        if (!newFileExports.allExports[key]) {
            removals[key] = value;
        }
    }
    // Print comparison
    printResults({ changes: changes, additions: additions, removals: removals });
}
function printResults(_a) {
    var changes = _a.changes, additions = _a.additions, removals = _a.removals;
    var resultObject = {
        isBreaking: areChangesBreaking({ changes: changes, additions: additions, removals: removals }),
        additions: Object.keys(additions),
        changes: Object.keys(changes),
        removals: Object.keys(removals)
    };
    console.log('');
    console.log('===================================');
    console.log(JSON.stringify(resultObject, null, 4));
    console.log('===================================');
}
function areChangesBreaking(_a) {
    var changes = _a.changes, additions = _a.additions, removals = _a.removals;
    return Object.keys(removals).length > 0 || Object.keys(changes).length > 0;
}
// Returns TRUE if the Symbol has changed in a non-compatible way
function hasChanged(oldSymbol, newSymbol) {
    if (newSymbol.flags & ts.SymbolFlags.Function) {
        debug('Checking changes (Function)');
        return hasFunctionChanged(oldSymbol, newSymbol);
    }
    if (newSymbol.flags & ts.SymbolFlags.Class) {
        debug('Checking changes (Class)');
        return hasClassChanged(oldSymbol, newSymbol);
    }
    if (newSymbol.flags & ts.SymbolFlags.Variable) {
        debug('Checking changes (Variable)');
        return hasVariableChanged(oldSymbol, newSymbol);
    }
    if (newSymbol.flags & ts.SymbolFlags.Interface) {
        debug('Checking changes (Interface)');
        return hasInterfaceChanged(oldSymbol, newSymbol);
    }
    if (newSymbol.flags & ts.SymbolFlags.Enum) {
        debug('Checking changes (Enum)');
        return hasEnumChanged(oldSymbol, newSymbol);
    }
    if (newSymbol.flags & ts.SymbolFlags.Type) {
        debug('Checking changes (Type)');
        return hasTypeChanged(oldSymbol, newSymbol);
    }
}
// Returns TRUE if the function has changed in a way that it could break the current implementations using it.
function hasFunctionChanged(oldSymbol, newSymbol) {
    var oldDeclaration = oldSymbol.valueDeclaration;
    var newDeclaration = newSymbol.valueDeclaration;
    // Check every function parameter
    // All old parameters must be present at their old position
    for (var i = 0; i < oldDeclaration.parameters.length; i++) {
        // No parameter at the same position
        if (!newDeclaration.parameters[i]) {
            return true;
        }
        // Changed parameter at the old position
        if (newDeclaration.parameters[i].getText() !== oldDeclaration.parameters[i].getText()) {
            return true;
        }
    }
    // All new parameters must be optional
    for (var i = 0; i < newDeclaration.parameters.length; i++) {
        if (!oldDeclaration.parameters[i] && !newChecker.isOptionalParameter(newDeclaration.parameters[i])) {
            return true;
        }
    }
    // Function return type signature must be the same
    if (oldDeclaration.type.getText() !== newDeclaration.type.getText()) {
        return true;
    }
    return false;
}
function hasInterfaceChanged(oldSymbol, newSymbol) {
    return false;
}
function hasVariableChanged(oldSymbol, newSymbol) {
    return false;
}
function hasClassChanged(oldSymbol, newSymbol) {
    return false;
}
function hasEnumChanged(oldSymbol, newSymbol) {
    return false;
}
function hasTypeChanged(oldSymbol, newSymbol) {
    return false;
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
    return { checker: checker, allExports: allExports };
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
function censor(censor) {
    var i = 0;
    return function (key, value) {
        if (i !== 0 && typeof censor === 'object' && typeof value == 'object' && censor == value)
            return '[Circular]';
        if (i >= 29)
            // seems to be a harded maximum of 30 serialized objects?
            return '[Unknown]';
        ++i; // so we know we aren't using the original object anymore
        return value;
    };
}
function stringify(obj) {
    return JSON.stringify(obj, censor(obj));
}
