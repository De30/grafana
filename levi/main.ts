import * as ts from 'typescript';
import * as fs from 'fs';

findExports(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});

function findExports(fileNames: string[], options: ts.CompilerOptions): void {
  let program = ts.createProgram(fileNames, options);
  let checker = program.getTypeChecker();
  let allExportNames = [];

  for (const sourceFile of program.getSourceFiles()) {
    const fileSymbol = checker.getSymbolAtLocation(sourceFile);
    const exportNames = getExportNames(fileSymbol);

    // Print to console
    if (exportNames.length) {
      console.log(sourceFile.fileName);
      console.log(exportNames);
    }

    allExportNames = allExportNames.concat(exportNames);
  }

  fs.writeFileSync('classes.json', JSON.stringify(allExportNames, undefined, 4));
}

function getExportNames(fileSymbol: ts.Symbol) {
  const exportedNames = [];

  if (fileSymbol?.exports) {
    fileSymbol.exports.forEach((value, key) => {
      exportedNames.push(key);
    });
  }

  return exportedNames.filter((n) => n !== '__export');
}
