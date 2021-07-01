import React from 'react';
import { TextArea, Field, TableInputCSV, CodeEditor } from '@grafana/ui';
import { StoryboardDocumentElement } from '../../types';

interface Props {
  element: StoryboardDocumentElement;
  onUpdate: (element: StoryboardDocumentElement) => void;
}

export function ShowStoryboardDocumentElementEditor({ element, onUpdate }: Props): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return (
        <Field label="Markdown text  ">
          <TextArea
            defaultValue={element.content}
            onChange={(event) => {
              let newElement = element;
              newElement.content = event.currentTarget.value;
              onUpdate(newElement);
            }}
            onBlur={(event) => {
              // Make the markdown render here if it can't be rendered onChange
              // let newElement = element;
              // newElement.content = event.currentTarget.value;
              // onUpdate(newElement);
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
            let newElement = element;
            newElement.content.data = data[0];
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
      return <CodeEditor value={element.script} language="python" height={200} showLineNumbers />;
    }
    case 'query': {
      return (
        <>
          <div>datasource: {element.datasource}</div>
          <div>
            <CodeEditor value={JSON.stringify(element.query)} height={100} language="promql" showLineNumbers />
          </div>
        </>
      );
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
