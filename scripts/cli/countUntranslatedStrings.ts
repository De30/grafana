import generator from '@babel/generator';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
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

// should be all lowercase
const TRANSLATED_PROP_NAMES = [
  'title',
  'label',
  'description',
  'body',
  'text',
  'content',
  'placeholder',
  'message',
  'error',
  'alt',
  'tooltip',
];

function generate(node: any) {
  return generator(node).code;
}

async function main() {
  const root = path.resolve('./');
  const files = await findFiles(root, FILE_EXCLUDE_FILTER);

  const codeFiles = files
    .filter((v) => v.match(/\.tsx/) && !v.match(/\.(test|spec|story|story\.internal)\.tsx/))
    .slice(0, 5000);
  // .filter((v) => v.includes('ExternalAlertmanagers.tsx'));

  const countsPerFile: Record<string, number> = {};

  const alreadyLoggedNotTranslatable: string[] = [];
  const visitedNodes: any[] = [];

  for (const codeFilePath of codeFiles) {
    const projectFilePath = codeFilePath.replace(root, '');
    countsPerFile[projectFilePath] = 0;
    const source = await readFile(codeFilePath);

    const ast = parser.parse(source.toString(), {
      sourceFilename: codeFilePath,
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    traverse(ast, {
      JSXAttribute: function (path) {
        const { node } = path;

        if (node.name.type !== 'JSXIdentifier') {
          return;
        }

        if (!node.value) {
          return;
        }

        const isString = node.value.type === 'StringLiteral';
        const isTemplateString =
          node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'TemplateLiteral';

        if (isString || isTemplateString) {
          const propName = node.name.name.toLowerCase();
          const propNameMatches = TRANSLATED_PROP_NAMES.some((v) => propName.includes(v));
          const trimmedString = (node.value.type === 'StringLiteral' && node.value.value?.trim()) || '';
          const stringMatches = isTemplateString || trimmedString.length > 0;

          if (propNameMatches && stringMatches) {
            if (propName.includes('tooltip')) {
              console.log('✅', { name: node.name.name, value: generate(node.value) });
            }
            countsPerFile[projectFilePath] += 1;
          } else if (!alreadyLoggedNotTranslatable.includes(node.name.name)) {
            console.log('❌', { name: node.name.name, value: generate(node.value) });
            alreadyLoggedNotTranslatable.push(node.name.name);
          }
        }
      },

      JSXElement: function (path) {
        const { node } = path;

        if (visitedNodes.includes(node)) {
          console.log('already visited node as child, not counting', generator(node).code);

          return;
        }

        const isTrans = node.openingElement.name.type === 'JSXIdentifier' && node.openingElement.name.name === 'Trans';

        if (isTrans) {
          return;
        }

        const hasTextChildren = node.children.some(
          (child) => child.type === 'JSXText' && child.value.trim().length > 0
        );

        if (hasTextChildren) {
          visitedNodes.push(...node.children);
          countsPerFile[projectFilePath] += 1;
        }
      },
    });
  }

  console.log(countsPerFile);
}

main().catch(console.error);
