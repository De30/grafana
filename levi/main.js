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
var currentChecker;
run();
function run() {
    var _a = process.argv.slice(2), oldFile = _a[0], newFile = _a[1];
    compareExports(oldFile, newFile);
}
function compareExports(oldFile, newFile) {
    debug('Old filename: %o', oldFile);
    debug('New filename: %o', newFile);
    var prevExports = getAllExports(oldFile);
    var currentExports = getAllExports(newFile);
    var additions = {};
    var removals = {};
    var changes = {};
    // Cache
    oldChecker = prevExports.checker;
    currentChecker = currentExports.checker;
    debug('Previous file: %o exports', Object.keys(prevExports.allExports).length);
    debug('Current file: %o exports', Object.keys(currentExports.allExports).length);
    // Look for additions and changes
    for (var _i = 0, _a = Object.entries(currentExports.allExports); _i < _a.length; _i++) {
        var _b = _a[_i], exportName = _b[0], exportSymbol = _b[1];
        // Addition
        if (!prevExports.allExports[exportName]) {
            additions[exportName] = exportSymbol;
            // Change
        }
        else {
            if (hasChanged({ key: exportName, symbol: prevExports.allExports[exportName] }, { key: exportName, symbol: exportSymbol })) {
                changes[exportName] = exportSymbol;
            }
        }
    }
    // Look for removals
    for (var _c = 0, _d = Object.entries(prevExports.allExports); _c < _d.length; _c++) {
        var _e = _d[_c], exportName = _e[0], exportSymbol = _e[1];
        // Removal
        if (!currentExports.allExports[exportName]) {
            removals[exportName] = exportSymbol;
        }
    }
    // Print comparison
    printResults({ changes: changes, additions: additions, removals: removals });
}
function printResults(_a) {
    var changes = _a.changes, additions = _a.additions, removals = _a.removals;
    var resultObject = {
        isBreaking: areChangesBreaking({ changes: changes, additions: additions, removals: removals }),
        additions: Object.keys(additions).map(function (name) { return ({
            name: name,
            value: additions[name].declarations[0].getText()
        }); }),
        changes: Object.keys(changes),
        removals: Object.keys(removals)
    };
    console.log('');
    console.log('===================================');
    console.log(JSON.stringify(resultObject, null, 4));
    console.log('===================================');
}
// Tip: use https://ts-ast-viewer.com for discovering certain types more easily
function areChangesBreaking(_a) {
    var changes = _a.changes, additions = _a.additions, removals = _a.removals;
    return Object.keys(removals).length > 0 || Object.keys(changes).length > 0;
}
// Returns TRUE if the Symbol has changed in a non-compatible way
function hasChanged(prev, current) {
    if (current.symbol.flags & ts.SymbolFlags.Function) {
        debug("Checking changes for \"".concat(current.key, "\" (Function)"));
        return hasFunctionChanged(prev, current);
    }
    if (current.symbol.flags & ts.SymbolFlags.Class) {
        debug("Checking changes for \"".concat(current.key, "\" (Class)"));
        return hasClassChanged(prev, current);
    }
    if (current.symbol.flags & ts.SymbolFlags.Variable) {
        debug("Checking changes for \"".concat(current.key, "\" (Variable)"));
        return hasVariableChanged(prev, current);
    }
    if (current.symbol.flags & ts.SymbolFlags.Interface) {
        debug("Checking changes for \"".concat(current.key, "\" (Interface)"));
        return hasInterfaceChanged(prev, current);
    }
    if (current.symbol.flags & ts.SymbolFlags.Enum) {
        debug("Checking changes for \"".concat(current.key, "\" (Enum)"));
        return hasEnumChanged(prev, current);
    }
    if (current.symbol.flags & ts.SymbolFlags.Type) {
        debug("Checking changes for \"".concat(current.key, "\" (Type)"));
        return hasTypeChanged(prev, current);
    }
}
function hasFunctionChanged(prev, current) {
    var prevDeclaration = prev.symbol.valueDeclaration;
    var currentDeclaration = current.symbol.valueDeclaration;
    // Check previous function parameters
    // (all previous parameters must be present at their previous position)
    for (var i = 0; i < prevDeclaration.parameters.length; i++) {
        // No parameter at the same position
        if (!currentDeclaration.parameters[i]) {
            return true;
        }
        // Changed parameter at the old position
        if (currentDeclaration.parameters[i].getText() !== prevDeclaration.parameters[i].getText()) {
            return true;
        }
    }
    // Check current function parameters
    // (all current parameters must be optional)
    for (var i = 0; i < currentDeclaration.parameters.length; i++) {
        if (!prevDeclaration.parameters[i] && !currentChecker.isOptionalParameter(currentDeclaration.parameters[i])) {
            return true;
        }
    }
    // Check return type signatures
    // (they must be the same)
    if (prevDeclaration.type.getText() !== currentDeclaration.type.getText()) {
        return true;
    }
    return false;
}
function hasInterfaceChanged(prev, current) {
    var prevDeclaration = prev.symbol.declarations[0];
    var currentDeclaration = current.symbol.declarations[0];
    // Check previous members
    // (all previous members must be left intact, otherwise any code that depends on them can possibly have type errors)
    for (var i = 0; i < prevDeclaration.members.length; i++) {
        // No member at the previous location
        if (!currentDeclaration.members[i]) {
            return true;
        }
        // Member at the previous location changed
        if (currentDeclaration.members[i].getText() !== prevDeclaration.members[i].getText()) {
            return true;
        }
    }
    // Check current members
    // (only optional new members are allowed)
    for (var i = 0; i < currentDeclaration.members.length; i++) {
        if (!prevDeclaration.members[i] && !currentDeclaration.members[i].questionToken) {
            return true;
        }
    }
    return false;
}
function hasVariableChanged(prev, current) {
    var prevDeclaration = prev.symbol.declarations[0];
    var currentDeclaration = current.symbol.declarations[0];
    // Changed if anything has changed in its type signature
    // (any type changes can cause issues in the code that depends on them)
    if (prevDeclaration.getText() !== currentDeclaration.getText()) {
        return true;
    }
    return false;
}
function hasClassChanged(prev, current) {
    var prevDeclaration = prev.symbol.declarations[0];
    var currentDeclaration = current.symbol.declarations[0];
    var _loop_1 = function (i) {
        var prevMemberText = prevDeclaration.members[i].getText();
        var currentMember = currentDeclaration.members.find(function (member) { return prevMemberText === member.getText(); });
        // Member is missing in the current declaration, or has changed
        // TODO: This is quite basic at the moment, it could be refined to give less "false negatives".
        //       (Consider a case for example when a class method receives a new optional parameter, which should not mean a breaking change)
        if (!currentMember) {
            return { value: true };
        }
    };
    // Check previous members
    // (all previous members must be left intact, otherwise any code that depends on them can possibly have type errors)
    for (var i = 0; i < prevDeclaration.members.length; i++) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    var _loop_2 = function (i) {
        var currentMemberText = currentDeclaration.members[i].getText();
        var prevMember = prevDeclaration.members.find(function (member) { return currentMemberText === member.getText(); });
        // The `questionToken` is not available on certain member types, but we don't let ourselves to be bothered by it being `undefined`
        if (!prevMember && !currentDeclaration.members[i].questionToken) {
            return { value: true };
        }
    };
    // Check current members
    // (only optional new members are allowed)
    for (var i = 0; i < currentDeclaration.members.length; i++) {
        var state_2 = _loop_2(i);
        if (typeof state_2 === "object")
            return state_2.value;
    }
    return false;
}
function hasEnumChanged(prev, current) {
    return false;
}
function hasTypeChanged(prev, current) {
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
