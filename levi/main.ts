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
      if (value.flags & ts.SymbolFlags.Interface) {
        console.log('(Interface)', key);
      } else if (value.flags & ts.SymbolFlags.Function) {
        console.log('(Function)', key);
        console.log('    changed: ', hasFunctionChanged(oldSymbol, newSymbol));
      } else if (value.flags & ts.SymbolFlags.Variable) {
        console.log('(Var)', key);
      } else if (value.flags & ts.SymbolFlags.Class) {
        console.log('(Class)', key);
      } else if (value.flags & ts.SymbolFlags.Enum) {
        console.log('(Enum)', key);
      } else if (value.flags & ts.SymbolFlags.Type) {
        console.log('(Type)', key);
      }
      console.log('');
    }
  }

  // Look for removals
  for (const [key, value] of Object.entries(oldFileExports.allExports)) {
    // Removal
    if (!newFileExports.allExports[key]) {
      removals[key] = value;
    }
  }

  // Validate comparison
  const isBreaking = Object.keys(removals).length > 0 || Object.keys(changes).length > 0;

  // Print comparison
  console.log('');
  console.log('Is breaking?', isBreaking);
  console.log('Additions:', Object.keys(additions));
  console.log('Changes:', Object.keys(changes));
  console.log('Removals:', Object.keys(removals));
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

function hasInterfaceChanged() {}

function hasVariableChanged() {}

function hasClassChanged() {}

function hasEnumChanged() {}

function hasTypeChanged() {}

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
