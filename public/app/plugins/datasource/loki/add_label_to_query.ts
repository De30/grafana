import { SyntaxNode } from '@lezer/common';

import { parser } from '@grafana/lezer-logql';

import { getString } from '../prometheus/querybuilder/shared/parsingUtils';

type AddSelector = {
  key: string;
  value: string;
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
  // console.log(queryParts);
  switch (node.name) {
    case 'Selector': {
      if (operations.addSelector) {
        const selector = getString(queryContext.query, node);
        const newSelector = addToSelector(selector, operations.addSelector);
        queryContext.query = updateQuery(queryContext.query, node, newSelector);
      }
    }

    // case 'LineFilters': {
    //   if (operations.addLineFilter) {
    //     const { query } = queryContext;
    //     const lineFilters = getString(query, node);
    //     const { value, operator } = operations.addLineFilter;
    //     console.log('lineFilters', lineFilters);

    //     const newLineFilters = lineFilters + ` ${operator} "${value}"`;
    //     queryContext.query = query.slice(0, node.from) + newLineFilters + query.slice(node.to, query.length);

    //     // console.log('query', query);
    //     // console.log('node.from', node.from);
    //     // console.log('start', query.slice(0, node.from));
    //     // console.log('operator', ` ${operator} "${value}"`);
    //     // console.log('end', query.slice(node.to, query.length));
    //     // console.log('alt end', query.slice(node.to, query.length - 1));

    //     queryContext.query = query.slice(0, node.from) + +query.slice(node.to, query.length);
    //   }
    // }

    default: {
      // Any other nodes we just ignore and go to it's children. This should be fine as there are lot's of wrapper
      // nodes that can be skipped.
      // TODO: there are probably cases where we will just skip nodes we don't support and we should be able to
      //  detect those and report back.
      // console.log('other', node.name, getString(expr, node));
      let child = node.firstChild;
      while (child) {
        handleExpression(child, operations, queryContext, queryParts);
        child = child.nextSibling;
      }
    }
  }
}

export function addOperations(query: string, operations: AddOperations): string {
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
  console.log(finalQuery);
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
  const operator = addLabel.operator ? addLabel.operator : '=';
  return selector.slice(0, selector.length - 1) + `, ${addLabel.key}${operator}"${addLabel.value}"}`;
}

function updateQuery(query: string, replacementNode: SyntaxNode, replacement: string): string {
  return query.slice(0, replacementNode.from) + replacement + query.slice(replacementNode.to, query.length);
}
