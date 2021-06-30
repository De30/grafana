import React, { FC, useMemo } from 'react';
import { css } from '@emotion/css';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { useSavedStoryboards } from '../hooks';
import { Storyboard } from '../types';
import { getLocationSrv } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

import PyWorker from '../web-workers/pyodide.worker';
import { useObservable } from 'react-use';
import { Observable, from } from 'rxjs';

import { concatMap } from 'rxjs/operators';

interface StoryboardRouteParams {
  uid: string;
}

type StorybookId = string;

interface StorybookVariable {
  value: unknown;
}

interface StorybookContext {
  [property: string]: StorybookVariable;
}

interface StorybookPlainText {
  id: StorybookId;
  type: 'plaintext';
  content: string;
}

interface StorybookDatasourceQuery {
  id: StorybookId;
  type: 'query';
  datasource: string;
  query: string;
  timeRange: [string, string];
}

interface StorybookMarkdown {
  id: StorybookId;
  type: 'markdown';
  content: string;
}

interface StorybookPython {
  id: StorybookId;
  type: 'python';
  script: string;
}

type StorybookDocumentElement = StorybookPlainText | StorybookMarkdown | StorybookPython | StorybookDatasourceQuery;

// Describes an unevaluated storybook (no context)
interface CoreStorybookDocument {
  elements: StorybookDocumentElement[];
}

interface UnevaluatedStorybookDocument extends CoreStorybookDocument {
  status: 'unevaluated';
}

// Evaluated storybooks have context, which is just results from evaluation bound to names. context is
// constructed as we evaluate, and then documents can observe the results appear
interface EvaluatedStorybookDocument extends CoreStorybookDocument {
  status: 'evaluating' | 'evaluated';
  context: StorybookContext;
}

type StorybookDocument = EvaluatedStorybookDocument | UnevaluatedStorybookDocument;

/// documents are a simple list of nodes. they can each be documentation, or code. cells can refer to
/// each-other's output, including data and text. some nodes produce realtime data.
const document: StorybookDocument = {
  status: 'unevaluated',
  elements: [
    // presentational markdown
    { id: 'markdown', type: 'markdown', content: '# This is markdown' },

    // Directly embed csv
    { id: 'csv', type: 'plaintext', content: '1,23,4' },

    // Fetch data from remote url and expose result
    // { id: 'fetched', type: 'fetch', url: './works.csv' },

    // Perform a query and put data into local context
    { id: 'query', type: 'query', datasource: 'prometheus', query: 'abc', timeRange: ['121', '123'] },

    // Show a timeseries
    // { id: 'presentation', type: 'timeseries-view', from: 'query' },

    // raw json data
    // {
    //   id: 'rawtime',
    //   type: 'json',
    //   content: [
    //     { time: 1, value: 123 },
    //     { time: 2, value: 124 },
    //   ],
    // },
    //
    {
      id: 'compute1',
      type: 'python',
      script: `
from js import csv;
print(csv)
42`,
    },
    {
      id: 'compute2',
      type: 'python',
      script: `
from js import compute1;
compute1 + 42`,
    },
  ],
};

async function evaluateElement(context: StorybookContext, n: StorybookDocumentElement): Promise<StorybookVariable> {
  switch (n.type) {
    case 'markdown': {
      return { value: n.content };
    }
    case 'query': {
      // TODO: Do a query against grafnaa api and put the result into context
      return { value: '' };
    }
    case 'plaintext': {
      return { value: n.content };
    }
    case 'python': {
      const value = await run(n.script, context);
      return { value };
    }
  }
  return { value: undefined };
}

function ElementType({ element }: { element: StorybookDocumentElement }): JSX.Element {
  return (
    <div
      className={css`
        font-size: 10px;
        margin-top: 20px;
        opacity: 0.5;
      `}
    >
      {element.type} — <strong>#{element.id}</strong>
    </div>
  );
}

function ShowStorybookDocumentElement({ element }: { element: StorybookDocumentElement }): JSX.Element {
  switch (element.type) {
    case 'markdown': {
      return <div>TODO: TRANSFORM: {element.content}</div>;
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
            query: <pre>{element.query}</pre>
          </div>
        </>
      );
    }
  }
  return <>{JSON.stringify(element)}</>;
}

/// Transforms a document into an evaledDocument (has results)
function evaluateDocument(doc: UnevaluatedStorybookDocument): Observable<EvaluatedStorybookDocument> {
  const result: EvaluatedStorybookDocument = {
    status: 'evaluating',
    context: {},
    elements: doc.elements,
  };

  const obs: Observable<EvaluatedStorybookDocument> = from<StorybookDocumentElement[]>(doc.elements).pipe(
    concatMap(async (v: StorybookDocumentElement) => {
      console.log('Evaluating %s with context %o', v.id, result.context);
      const res = await evaluateElement(result.context, v);
      result.context[v.id] = res;
      return { ...result };
    })
  );

  return obs;
}

const locationSrv = getLocationSrv();

let pyodideWorker: Worker | undefined = undefined;
pyodideWorker = (() => {
  if (pyodideWorker == null) {
    return new PyWorker();
  }
  return pyodideWorker;
})();

export const StoryboardView: FC<StoryboardRouteParams> = ({ uid }) => {
  const { boards } = useSavedStoryboards();
  const board = boards.find((b) => b.uid === uid);
  if (!board) {
    locationSrv.update({ path: '/storyboards', partial: true });
  }

  const { title } = board as Storyboard;
  const navModel = {
    main: {
      text: title,
      icon: 'book-open',
    },
    node: {
      text: 'Storyboards',
    },
  };

  const evaled = useMemo(() => evaluateDocument(document), []);
  const evaluation = useObservable(evaled);

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <div>
          <h2>Title of doc</h2>
          <hr />
          <div
            className={css`
              display: flex;
              flex-direction: column;
            `}
          >
            {evaluation?.elements.map((m) => (
              <div key={m.id}>
                <ElementType element={m} />
                <ShowStorybookDocumentElement element={m} />
                <div>RESULT: {JSON.stringify(evaluation?.context[m.id])}</div>
              </div>
            ))}
          </div>
        </div>
      </Page.Contents>
    </Page>
  );
};

function runCallback(
  script: string,
  context: StorybookContext,
  onSuccess: (data: string) => void,
  onError: (ev: ErrorEvent) => any
) {
  if (pyodideWorker == null) {
    return;
  }
  pyodideWorker.onerror = (e) => onError(e);
  pyodideWorker.onmessage = (e) => onSuccess(e.data.results);
  pyodideWorker.postMessage({
    ...context,
    python: script,
  });
}

export function run(script: string, context: StorybookContext): Promise<any> {
  return new Promise(function (onSuccess, onError) {
    runCallback(script, context, onSuccess, onError);
  });
}

const mapStateToProps = (state: StoreState, props: GrafanaRouteComponentProps<StoryboardRouteParams>) => {
  return {
    uid: props.match.params.uid,
  };
};

export default connect(mapStateToProps)(StoryboardView);
