import React from 'react';
import { TextArea, Field, TableInputCSV } from '@grafana/ui';
import { StoryboardDocumentElement } from '../../types';

interface Props {
  element: StoryboardDocumentElement;
}

export function ShowStoryboardDocumentElementEditor({ element }: Props): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return (
        <Field label="Markdown text  ">
          <TextArea
            defaultValue={element.content}
            onChange={(event) => {
              element.content = event.currentTarget.value;
            }}
            onBlur={() => {
              // Make the markdown render here if it can't be rendered onChange
            }}
          />
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
            console.log(data);
          }}
        />
      );
    }
    case 'plaintext': {
      return <pre>{element.content}</pre>;
    }
    case 'python': {
      return <pre>{element.script}</pre>;
    }
    case 'query': {
      return (
        <>
          <div>datasource: {element.datasource}</div>
          <div>
            query: <pre>{JSON.stringify(element.query)}</pre>
          </div>
        </>
      );
    }
  }
  return <>{JSON.stringify(element)}</>;
}
