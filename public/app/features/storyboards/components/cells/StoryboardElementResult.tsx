import React from 'react';
import { StoryboardDocumentElement, StoryboardVariable } from '../../types';
import { css } from '@emotion/css';
import { renderMarkdown } from '@grafana/data';
import { Table } from '@grafana/ui';

export function ShowStoryboardDocumentElementResult({
  element,
  result,
}: {
  element: StoryboardDocumentElement;
  result?: StoryboardVariable;
}): JSX.Element | null {
  if (result == null) {
    return null;
  }
  switch (element.type) {
    case 'markdown': {
      // we should parse markdown with a strict subset of options directly to JSX with a library like this:
      // https://github.com/rexxars/commonmark-react-renderer
      const md = renderMarkdown(result.value as string);

      return <div dangerouslySetInnerHTML={{ __html: md }} />;
    }
    // Maybe use the Table component here?
    case 'csv': {
      return element.content.data ? <Table data={element.content.data} width={100} height={300} /> : <></>;
    }
    case 'plaintext': {
      return null;
    }
    case 'python': {
      return (
        <div>
          <div
            className={css`
              font-size: 10px;
              margin-top: 20px;
              opacity: 0.5;
            `}
          >
            RESULT:
          </div>
          <pre>{JSON.stringify(result)}</pre>
        </div>
      );
    }
    case 'query': {
      // TODO: Result of query as table
      return (
        <>
          <pre>{JSON.stringify(result.value.series)}</pre>
        </>
      );
    }
  }
}
