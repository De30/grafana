import { SyntaxNode } from '@lezer/common';

import { parser } from '@grafana/lezer-logql';

import { getString } from '../prometheus/querybuilder/shared/parsingUtils';

type AddSelector = {
  key: string;
  value: string | number;
  operator: string;
};

type AddOperations = {
  addSelector?: AddSelector;
};

interface QueryContext {
  query: string;
}

function handleExpression(
  node: SyntaxNode,
  operations: AddOperations,
  queryContext: QueryContext,
  queryParts: string[]
) {
  switch (node.name) {
    case 'Selector': {
      if (operations.addSelector && !queryParts.includes('LabelParser')) {
        const selector = getString(queryContext.query, node);
        const newSelector = addToSelector(selector, operations.addSelector);
        queryContext.query = updateQuery(queryContext.query, node, newSelector);
      }
      break;
    }

    case 'LabelParser': {
      if (operations.addSelector && queryParts.includes('LabelParser')) {
        const parser = getString(queryContext.query, node);
        const parserWithParsedLabels = addParsedLabelAfterParser(parser, operations.addSelector);
        queryContext.query = updateQuery(queryContext.query, node, parserWithParsedLabels);
      }
      break;
    }

    default: {
      let child = node.firstChild;
      while (child) {
        handleExpression(child, operations, queryContext, queryParts);
        child = child.nextSibling;
      }
    }
  }
}

export function addOperations(query: string, operations: AddOperations): string {
  if (!query) {
    throw Error('no query provided');
  }
  const queryContext: QueryContext = {
    query: query,
  };

  const tree = parser.parse(query);
  const node = tree.topNode;

  try {
    const queryParts: string[] = [];
    getQueryParts(node, queryParts);
    handleExpression(node, operations, queryContext, queryParts);
  } catch (err) {
    console.log('err', err);
  }

  const finalQuery = queryContext.query;
  return finalQuery;
}

function getQueryParts(node: SyntaxNode, parts: string[]) {
  parts.push(node.name);
  let child = node.firstChild;
  while (child) {
    getQueryParts(child, parts);
    child = child.nextSibling;
  }
}

function addToSelector(selector: string, addLabel: AddSelector): string {
  const { key, operator, value } = addLabel;
  if (selector === '{}') {
    return `{${key}${operator}"${value}"}`;
  }
  return selector.slice(0, selector.length - 1) + `,${key}${operator}"${value}"}`;
}

function addParsedLabelAfterParser(parser: string, addLabel: AddSelector): string {
  const { key, operator, value } = addLabel;
  return parser + ` | ${key}${operator}"${value}"`;
}

function updateQuery(query: string, replacementNode: SyntaxNode, replacement: string): string {
  return query.slice(0, replacementNode.from) + replacement + query.slice(replacementNode.to, query.length);
}
