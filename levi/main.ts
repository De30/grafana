import * as ts from 'typescript';
import * as fs from 'fs';
import getDebug from 'debug';

const debug = getDebug('compare');
let oldChecker: ts.TypeChecker;
let newChecker: ts.TypeChecker;

run();

function run() {
  const [oldFile, newFile] = process.argv.slice(2);
  compareExports(oldFile, newFile);
}

function compareExports(oldFile: string, newFile: string): void {
  debug('Old filename: %o', oldFile);
  debug('New filename: %o', newFile);

  const oldFileExports = getAllExports(oldFile);
  const newFileExports = getAllExports(newFile);
  const additions = {};
  const removals = {};
  const changes = {};

  // Cache
  oldChecker = oldFileExports.checker;
  newChecker = newFileExports.checker;

  debug('Old file: %o exports', Object.keys(oldFileExports.allExports).length);
  debug('New file: %o exports', Object.keys(newFileExports.allExports).length);

  // Look for additions and changes
  for (const [key, value] of Object.entries(newFileExports.allExports)) {
    // Addition
    if (!oldFileExports.allExports[key]) {
      additions[key] = value;

      // Change
    } else {
      const oldSymbol = oldFileExports.allExports[key];
      const newSymbol = value;

      if (hasChanged(oldSymbol, newSymbol)) {
        changes[key] = value;
      }
    }
  }

  // Look for removals
  for (const [key, value] of Object.entries(oldFileExports.allExports)) {
    // Removal
    if (!newFileExports.allExports[key]) {
      removals[key] = value;
    }
  }

  // Print comparison
  printResults({ changes, additions, removals });
}

function printResults({
  changes,
  additions,
  removals,
}: {
  changes: Record<string, ts.Symbol>;
  additions: Record<string, ts.Symbol>;
  removals: Record<string, ts.Symbol>;
}) {
  const resultObject = {
    isBreaking: areChangesBreaking({ changes, additions, removals }),
    additions: Object.keys(additions),
    changes: Object.keys(changes),
    removals: Object.keys(removals),
  };

  console.log('');
  console.log('===================================');
  console.log(JSON.stringify(resultObject, null, 4));
  console.log('===================================');
}

function areChangesBreaking({
  changes,
  additions,
  removals,
}: {
  changes: Record<string, ts.Symbol>;
  additions: Record<string, ts.Symbol>;
  removals: Record<string, ts.Symbol>;
}) {
  return Object.keys(removals).length > 0 || Object.keys(changes).length > 0;
}

// Returns TRUE if the Symbol has changed in a non-compatible way
function hasChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
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
function hasFunctionChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  const oldDeclaration = oldSymbol.valueDeclaration as ts.FunctionDeclaration;
  const newDeclaration = newSymbol.valueDeclaration as ts.FunctionDeclaration;

  // Check every function parameter
  // All old parameters must be present at their old position
  for (let i = 0; i < oldDeclaration.parameters.length; i++) {
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
  for (let i = 0; i < newDeclaration.parameters.length; i++) {
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

function hasInterfaceChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  return false;
}

function hasVariableChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  return false;
}

function hasClassChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  return false;
}

function hasEnumChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  return false;
}

function hasTypeChanged(oldSymbol: ts.Symbol, newSymbol: ts.Symbol) {
  return false;
}

function getAllExports(fileName: string): { checker: ts.TypeChecker; allExports: Record<string, ts.Symbol> } {
  let program = ts.createProgram([fileName], { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS });
  let checker = program.getTypeChecker();
  let allExports = {};

  for (const sourceFile of program.getSourceFiles()) {
    const fileSymbol = checker.getSymbolAtLocation(sourceFile);
    const fileExports = getFileSymbolExports(fileSymbol);

    allExports = { ...allExports, ...fileExports };
  }

  return { checker, allExports };
}

function getFileSymbolExports(file: ts.Symbol): Record<string, ts.Symbol> {
  const fileExports = {};

  if (file?.exports) {
    file.exports.forEach((value, key) => {
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
    if (i !== 0 && typeof censor === 'object' && typeof value == 'object' && censor == value) return '[Circular]';

    if (i >= 29)
      // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';

    ++i; // so we know we aren't using the original object anymore

    return value;
  };
}

function stringify(obj: any) {
  return JSON.stringify(obj, censor(obj));
}
