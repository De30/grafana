import * as ts from 'typescript';
import * as fs from 'fs';
import getDebug from 'debug';

interface ResolvedSourceFile extends ts.SourceFile {
  resolvedModules?: Map<string, ts.ResolvedModuleFull | undefined>;
}

const imports = [];

run();

function run() {
  const [file] = process.argv.slice(2);
  getImports(file);

  const imports2 = imports.reduce((prev, curr) => {
    curr.namedImports.map((namedImport) => {
      if (prev[namedImport]) {
        prev[namedImport] += 1;
      } else {
        prev[namedImport] = 1;
      }
    });

    return prev;
  }, {});
  console.log(JSON.stringify(imports2, null, 4));
}

function getImports(fileName: string) {
  const moduleName = '@grafana/runtime';
  let program = ts.createProgram([fileName], { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS });
  let checker = program.getTypeChecker();
  let allExports = {};

  for (const sourceFile of program.getSourceFiles()) {
    // console.log(sourceFile.fileName);
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, visit);
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const importObj = {
        import: node.getText(),
        from: node.moduleSpecifier.getText().replace(/'/g, '').replace(/"/g, ''),
        namedImports:
          node.importClause.namedBindings && (node.importClause.namedBindings as ts.NamedImports).elements
            ? (node.importClause.namedBindings as ts.NamedImports).elements.map((e) => e.getText())
            : [],
      };

      if (importObj.from.includes(moduleName)) {
        imports.push(importObj);
      }

      imports.push();
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      ts.forEachChild(node, visit);
    }
  }
}
