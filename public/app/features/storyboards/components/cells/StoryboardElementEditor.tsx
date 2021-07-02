import React from 'react';
import { TextArea, Field, TableInputCSV, CodeEditor } from '@grafana/ui';
import { renderMarkdown } from '@grafana/data';

import { StoryboardDatasourceQueryEditor } from './StoryboardDatasourceQueryEditor';
import { StoryboardDocumentElement } from '../../types';

interface Props {
  element: StoryboardDocumentElement;
  onUpdate: (element: StoryboardDocumentElement) => void;
}

export function ShowStoryboardDocumentElementEditor({ element, onUpdate }: Props): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return (
        <Field>
          {element.editing ? (
            <div className="gf-form--grow">
              <TextArea
                defaultValue={element.content}
                className="gf-form-input"
                onBlur={(event) => {
                  element.editing = false;
                  let newElement = element;
                  newElement.content = event.currentTarget.value;
                  onUpdate(newElement);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && event.shiftKey) {
                    element.editing = false;
                    let newElement = element;
                    newElement.content = event.currentTarget.value;
                    onUpdate(newElement);
                  }
                }}
              />
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={
                // we should parse markdown with a strict subset of options directly to JSX with a library like this:
                // https://github.com/rexxars/commonmark-react-renderer
                { __html: renderMarkdown(element.content as string) }
              }
              onDoubleClick={() => {
                element.editing = true;
                onUpdate(element);
              }}
            />
          )}
        </Field>
      );
    }
    case 'csv': {
      return (
        <TableInputCSV
          width="100%"
          height="100px"
          text={element.content.text}
          onSeriesParsed={(data, text) => {
            let newElement = element;
            newElement.content.data = data;
            newElement.content.text = text;
            onUpdate(newElement);
          }}
        />
      );
    }
    case 'plaintext': {
      return <pre>{element.content}</pre>;
    }
    case 'python': {
      return (
        <CodeEditor
          value={element.script}
          language="python"
          height={200}
          showLineNumbers
          onBlur={(newCode) => {
            let newElement = element;
            newElement.script = newCode;
            onUpdate(newElement);
          }}
        />
      );
    }
    case 'query': {
      return (
        <StoryboardDatasourceQueryEditor
          datasourceUidOrName={element.datasource}
          onChangeDatasource={(newDatasource) => {
            let newElement = { ...element };
            newElement.datasource = newDatasource;
            onUpdate(newElement);
          }}
          query={element.query}
          onChangeQuery={(newQuery) => {
            let newElement = { ...element };
            newElement.query = newQuery;
            onUpdate(newElement);
          }}
        />
      );
      // return (
      //   <>
      //     <div>datasource: {element.datasource}</div>
      //     <div>
      //       query: <pre>{JSON.stringify(element.query)}</pre>
      //     </div>
      //   </>
      // );
    }
    case 'timeseries-plot': {
      return (
        <>
          <div>Plotting {element.from}</div>
        </>
      );
    }
  }
  return <>{JSON.stringify(element)}</>;
}
