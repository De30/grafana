import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { StoryboardContext, StoryboardDocumentElement, StoryboardVariable } from '../../types';
import { css } from '@emotion/css';
import { renderMarkdown } from '@grafana/data';
import { PanelData } from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { PanelChrome, Table } from '@grafana/ui';

export function ShowStoryboardDocumentElementResult({
  element,
  context,
  result,
}: {
  element: StoryboardDocumentElement;
  context: StoryboardContext;
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
          <pre>{JSON.stringify((result.value as PanelData).series)}</pre>
        </>
      );
    }
    case 'timeseries-plot': {
      return (
        <AutoSizer>
          {({ width, height }) => {
            if (width < 3 || height < 3) {
              return null;
            }

            return (
              <PanelChrome width={width} height={height}>
                {(innerWidth, innerHeight) => {
                  return (
                    <PanelRenderer
                      title=""
                      pluginId="timeseries"
                      width={innerWidth}
                      height={innerHeight}
                      data={context[element.from].value as PanelData}
                    />
                  );
                }}
              </PanelChrome>
            );
          }}
        </AutoSizer>
      );
    }
  }
}
