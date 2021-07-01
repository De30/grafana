import React from 'react';
import { TextArea, Field } from '@grafana/ui';
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
        <Field label="CSV">
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
