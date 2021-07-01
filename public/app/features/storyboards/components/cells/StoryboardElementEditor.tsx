import React from 'react';
import { StoryboardDocumentElement } from '../../types';

export function ShowStoryboardDocumentElementEditor({ element }: { element: StoryboardDocumentElement }): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return <div>{element.content}</div>;
    }
    case 'csv': {
      return <pre>{element.content}</pre>;
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
