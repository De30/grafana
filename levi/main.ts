import * as ts from 'typescript';
import * as fs from 'fs';
import getDebug from 'debug';

const debug = getDebug('compare');
let oldChecker: ts.TypeChecker;
let currentChecker: ts.TypeChecker;

type KeyAndSymbol = {
  key: string;
  symbol: ts.Symbol;
};

run();

function run() {
  const [oldFile, newFile] = process.argv.slice(2);
  compareExports(oldFile, newFile);
}

function compareExports(oldFile: string, newFile: string): void {
  debug('Old filename: %o', oldFile);
  debug('New filename: %o', newFile);

  const prevExports = getAllExports(oldFile);
  const currentExports = getAllExports(newFile);
  const additions = {};
  const removals = {};
  const changes = {};

  // Cache
  oldChecker = prevExports.checker;
  currentChecker = currentExports.checker;

  debug('Previous file: %o exports', Object.keys(prevExports.allExports).length);
  debug('Current file: %o exports', Object.keys(currentExports.allExports).length);

  // Look for additions and changes
  for (const [exportName, exportSymbol] of Object.entries(currentExports.allExports)) {
    // Addition
    if (!prevExports.allExports[exportName]) {
      additions[exportName] = exportSymbol;

      // Change
    } else {
      if (
        hasChanged(
          { key: exportName, symbol: prevExports.allExports[exportName] },
          { key: exportName, symbol: exportSymbol }
        )
      ) {
        changes[exportName] = exportSymbol;
      }
    }
  }

  // Look for removals
  for (const [exportName, exportSymbol] of Object.entries(prevExports.allExports)) {
    // Removal
    if (!currentExports.allExports[exportName]) {
      removals[exportName] = exportSymbol;
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
    additions: Object.keys(additions).map((name) => ({
      name,
      value: additions[name].declarations[0].getText(),
    })),
    changes: Object.keys(changes),
    removals: Object.keys(removals),
  };

  console.log('');
  console.log('===================================');
  console.log(JSON.stringify(resultObject, null, 4));
  console.log('===================================');
}

// Tip: use https://ts-ast-viewer.com for discovering certain types more easily
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
function hasChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  if (current.symbol.flags & ts.SymbolFlags.Function) {
    debug(`Checking changes for "${current.key}" (Function)`);
    return hasFunctionChanged(prev, current);
  }

  if (current.symbol.flags & ts.SymbolFlags.Class) {
    debug(`Checking changes for "${current.key}" (Class)`);
    return hasClassChanged(prev, current);
  }

  if (current.symbol.flags & ts.SymbolFlags.Variable) {
    debug(`Checking changes for "${current.key}" (Variable)`);
    return hasVariableChanged(prev, current);
  }

  if (current.symbol.flags & ts.SymbolFlags.Interface) {
    debug(`Checking changes for "${current.key}" (Interface)`);
    return hasInterfaceChanged(prev, current);
  }

  if (current.symbol.flags & ts.SymbolFlags.Enum) {
    debug(`Checking changes for "${current.key}" (Enum)`);
    return hasEnumChanged(prev, current);
  }

  if (current.symbol.flags & ts.SymbolFlags.Type) {
    debug(`Checking changes for "${current.key}" (Type)`);
    return hasTypeChanged(prev, current);
  }
}

function hasFunctionChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.valueDeclaration as ts.FunctionDeclaration;
  const currentDeclaration = current.symbol.valueDeclaration as ts.FunctionDeclaration;

  // Check previous function parameters
  // (all previous parameters must be present at their previous position)
  for (let i = 0; i < prevDeclaration.parameters.length; i++) {
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
  for (let i = 0; i < currentDeclaration.parameters.length; i++) {
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

function hasInterfaceChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.declarations[0] as ts.InterfaceDeclaration;
  const currentDeclaration = current.symbol.declarations[0] as ts.InterfaceDeclaration;

  // Check previous members
  // (all previous members must be left intact, otherwise any code that depends on them can possibly have type errors)
  for (let i = 0; i < prevDeclaration.members.length; i++) {
    const prevMemberText = prevDeclaration.members[i].getText();
    const currentMember = currentDeclaration.members.find((member) => prevMemberText === member.getText());

    // Member is missing in the current declaration, or has changed
    // TODO: This is quite basic at the moment, it could be refined to give less "false negatives".
    //       (Consider a case for example when an interface method receives a new optional parameter, which should not mean a breaking change)
    if (!currentMember) {
      return true;
    }
  }

  // Check current members
  // (only optional new members are allowed)
  for (let i = 0; i < currentDeclaration.members.length; i++) {
    const currentMemberText = currentDeclaration.members[i].getText();
    const prevMember = prevDeclaration.members.find((member) => currentMemberText === member.getText());

    if (!prevMember && !currentDeclaration.members[i].questionToken) {
      return true;
    }
  }

  return false;
}

function hasVariableChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.declarations[0] as ts.VariableDeclaration;
  const currentDeclaration = current.symbol.declarations[0] as ts.VariableDeclaration;

  // Changed if anything has changed in its type signature
  // (any type changes can cause issues in the code that depends on them)
  if (prevDeclaration.getText() !== currentDeclaration.getText()) {
    return true;
  }

  return false;
}

function hasClassChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.declarations[0] as ts.ClassDeclaration;
  const currentDeclaration = current.symbol.declarations[0] as ts.ClassDeclaration;

  // Check previous members
  // (all previous members must be left intact, otherwise any code that depends on them can possibly have type errors)
  for (let i = 0; i < prevDeclaration.members.length; i++) {
    const prevMemberText = prevDeclaration.members[i].getText();
    const currentMember = currentDeclaration.members.find((member) => prevMemberText === member.getText());

    // Member is missing in the current declaration, or has changed
    // TODO: This is quite basic at the moment, it could be refined to give less "false negatives".
    //       (Consider a case for example when a class method receives a new optional parameter, which should not mean a breaking change)
    if (!currentMember) {
      return true;
    }
  }

  // Check current members
  // (only optional new members are allowed)
  for (let i = 0; i < currentDeclaration.members.length; i++) {
    const currentMemberText = currentDeclaration.members[i].getText();
    const prevMember = prevDeclaration.members.find((member) => currentMemberText === member.getText());

    // The `questionToken` is not available on certain member types, but we don't let ourselves to be bothered by it being `undefined`
    if (!prevMember && !(currentDeclaration.members[i] as ts.PropertyDeclaration).questionToken) {
      return true;
    }
  }

  return false;
}

function hasEnumChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.declarations[0] as ts.EnumDeclaration;
  const currentDeclaration = current.symbol.declarations[0] as ts.EnumDeclaration;

  // Check previous members
  // (all previous members must be left intact, otherwise any code that depends on them can possibly have type errors)
  for (let i = 0; i < prevDeclaration.members.length; i++) {
    const prevMemberText = prevDeclaration.members[i].getText();
    const currentMember = currentDeclaration.members.find((member) => prevMemberText === member.getText());

    // Member is missing in the current declaration, or has changed
    if (!currentMember) {
      return true;
    }
  }

  // We don't care about any new members added at the moment
  // TODO: check if the statement above is valid

  return false;
}

function hasTypeChanged(prev: KeyAndSymbol, current: KeyAndSymbol) {
  const prevDeclaration = prev.symbol.declarations[0] as ts.TypeAliasDeclaration;
  const currentDeclaration = current.symbol.declarations[0] as ts.TypeAliasDeclaration;

  // Changed if anything has changed.
  // (This is a bit tricky, as a type declaration can be a `FunctionType`, a `UnionType`, a `TypeLiteral`, etc. A `TypeLiteral` should need to be checked similarly to a Class or an Interface.)
  // TODO: revisit how much trouble "false negatives" coming from this are causing us.
  if (prevDeclaration.getText() !== currentDeclaration.getText()) {
    return true;
  }

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
