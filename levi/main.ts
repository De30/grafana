import * as ts from 'typescript';
import * as fs from 'fs';

start(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});

function start(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);
  let checker = program.getTypeChecker();
  let allExportedNames = [];

  for (const sourceFile of program.getSourceFiles()) {
    const fileSymbol = checker.getSymbolAtLocation(sourceFile);
    const exportedNames = getExportedNames(fileSymbol);

    // Print to console
    if (exportedNames.length) {
      console.log(sourceFile.fileName);
      console.log(exportedNames);
    }

    allExportedNames = allExportedNames.concat(exportedNames);
  }

  fs.writeFileSync('classes.json', JSON.stringify(allExportedNames, undefined, 4));
}

function getExportedNames(fileSymbol: ts.Symbol) {
  const exportedNames = [];

  if (fileSymbol?.exports) {
    fileSymbol.exports.forEach((value, key) => {
      exportedNames.push(key);
    });
  }

  return exportedNames.filter((n) => n !== '__export');
}
