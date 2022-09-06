import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';

async function findFiles(dir: string, excludeFilter: RegExp): Promise<string[]> {
  const matched: string[] = [];

  const files = await readdir(dir);

  for (const child of files) {
    const childPath = path.join(dir, child);

    if (childPath.match(excludeFilter)) {
      continue;
    }

    const isDir = (await stat(childPath)).isDirectory();

    if (isDir) {
      const grandchildren = await findFiles(childPath, excludeFilter);
      matched.push(...grandchildren);
    } else {
      matched.push(childPath);
    }
  }

  return matched;
}

const FILE_EXCLUDE_FILTER = /node_modules|docs|\.git|\.yarn|e2e\/tmp/;

async function main() {
  const root = path.resolve('./');
  const files = await findFiles(root, FILE_EXCLUDE_FILTER);
  const codeFiles = files
    .filter((v) => v.match(/\.tsx?/) && !v.match(/\.(test|spec)\.tsx?/))
    .filter((v) => v.includes('Alert/Alert.tsx'));

  for (const codeFilePath of codeFiles) {
    const source = await readFile(codeFilePath);

    const ast = parser.parse(source.toString(), {
      sourceFilename: codeFilePath,
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    traverse(ast, {
      JSXAttribute: function (path) {
        const { node } = path;

        console.log(node);
      },
    });
  }
}

main().catch(console.error);
