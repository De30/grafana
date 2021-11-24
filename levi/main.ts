import * as ts from 'typescript';
import * as fs from 'fs';
import getDebug from 'debug';

const debug = getDebug('compare');

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

  debug('Old file: %o exports', Object.keys(oldFileExports).length);
  debug('New file: %o exports', Object.keys(newFileExports).length);

  // Look for additions and changes
  for (const [key, value] of Object.entries(newFileExports)) {
    // Addition
    if (!oldFileExports[key]) {
      additions[key] = value;

      // Change
    } else {
      //
    }
  }

  // Look for removals
  for (const [key, value] of Object.entries(oldFileExports)) {
    // Removal
    if (!newFileExports[key]) {
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

function getAllExports(fileName: string) {
  let program = ts.createProgram([fileName], { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS });
  let checker = program.getTypeChecker();
  let allExports = {};

  for (const sourceFile of program.getSourceFiles()) {
    const fileSymbol = checker.getSymbolAtLocation(sourceFile);
    const fileExports = getFileSymbolExports(fileSymbol);

    allExports = { ...allExports, ...fileExports };
  }

  return allExports;
}

function getFileSymbolExports(file: ts.Symbol) {
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
