import { readdir, stat } from 'fs/promises';
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
  const codeFiles = files.filter((v) => v.match(/\.tsx?/) && !v.match(/\.(test|spec)\.tsx?/));

  console.log(codeFiles);
}

main().catch(console.error);
