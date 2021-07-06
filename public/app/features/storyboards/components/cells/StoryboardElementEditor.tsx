import React from 'react';
import { TextArea, Field, TableInputCSV, CodeEditor, Select, HorizontalGroup, IconButton } from '@grafana/ui';
import { renderMarkdown } from '@grafana/data';

import { StoryboardDatasourceQueryEditor } from './StoryboardDatasourceQueryEditor';
import { StoryboardContext, StoryboardDocumentElement } from '../../types';
import { css } from '@emotion/css';

interface Props {
  element: StoryboardDocumentElement;
  context: StoryboardContext;
  onUpdate: (element: StoryboardDocumentElement) => void;
}

export function ShowStoryboardDocumentElementEditor({ element, context, onUpdate }: Props): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return (
        <Field>
          <div
            className={css`
              display: flex;
              justify-content: space-between;
            `}
          >
            {element.editing || element.content.trim() === '' ? (
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
                className="gf-form--grow"
                dangerouslySetInnerHTML={
                  // we should parse markdown with a strict subset of options directly to JSX with a library like this:
                  // https://github.com/rexxars/commonmark-react-renderer
                  { __html: renderMarkdown(element.content as string) }
                }
                onClick={() => {
                  element.editing = true;
                  onUpdate(element);
                }}
              />
            )}
            <IconButton
              size="lg"
              name={element.editing ? 'x' : 'pen'}
              onClick={() => {
                element.editing = !element.editing;
                onUpdate(element);
              }}
            />
          </div>
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
            if (newCode !== element.script) {
              let newElement = element;
              newElement.script = newCode;
              onUpdate(newElement);
            }
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
          timeRange={element.timeRange}
          onChangeTimeRange={(range) => {
            let newElement = { ...element };
            newElement.timeRange = range;
            onUpdate(newElement);
          }}
        />
      );
    }
    case 'timeseries-plot': {
      const options = Object.entries(context)
        .filter(([k, v]) => v.element?.type === 'query')
        .map(([k, v]) => ({ label: k, value: k }));
      return (
        <Select
          value={element.from}
          options={options}
          placeholder="Select a query"
          onChange={(value) => {
            if (value.value != null) {
              let newElement = element;
              newElement.from = value.value;
              onUpdate(newElement);
            }
          }}
        />
      );
    }
  }
  return <>{JSON.stringify(element)}</>;
}
