import React, { createContext, useEffect, FC, useMemo, ReactNode } from 'react';
import { css } from '@emotion/css';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { useSavedStoryboards } from '../hooks';
import { Storyboard } from '../types';
import { getLocationSrv, createQueryRunner } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

import { DataQuery, dateTime, DateTime, QueryRunner, TimeRange } from '@grafana/data';

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

interface StorybookCsv {
  id: StorybookId;
  type: 'csv';
  content: string;
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
  query: DataQuery;
  timeRange: TimeRange;
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

type StorybookDocumentElement =
  | StorybookPlainText
  | StorybookCsv
  | StorybookMarkdown
  | StorybookPython
  | StorybookDatasourceQuery;

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
const document: UnevaluatedStorybookDocument = {
  status: 'unevaluated',
  elements: [
    // presentational markdown
    { id: 'markdown', type: 'markdown', content: '# This is markdown' },

    // Directly embed csv
    {
      id: 'some_data',
      type: 'csv',
      content: `1,23,4
3,4,1`,
    },

    // Fetch data from remote url and expose result
    // { id: 'fetched', type: 'fetch', url: './works.csv' },

    // Perform a query and put data into local context
    {
      id: 'query',
      type: 'query',
      datasource: 'prometheus',
      query: { refId: 'query' },
      timeRange: { from: dateTime(), to: dateTime(), raw: { to: '', from: '' } },
    },

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
      script: `from js import some_data;
42 + int(some_data[0][1])`,
    },
    {
      id: 'compute2',
      type: 'python',
      script: `from js import compute1;
compute1 + 42`,
    },
  ],
};

async function evaluateElement(
  runner: QueryRunner,
  context: StorybookContext,
  n: StorybookDocumentElement
): Promise<StorybookVariable> {
  switch (n.type) {
    case 'markdown': {
      // value should be JSX:  https://github.com/rexxars/commonmark-react-renderer
      return { value: n.content };
    }
    case 'query': {
      runner.run({
        timeRange: n.timeRange,
        queries: [n.query],
        datasource: n.datasource,
        timezone: '',
        maxDataPoints: 100,
        minInterval: null,
      });
      const value = await runner.get().toPromise();
      return { value };
    }
    case 'csv': {
      // TODO: Use real CSV algorithm to split!
      return { value: n.content.split('\n').map((l) => l.split(',')) };
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

function ShowStorybookDocumentElementResult({
  element,
  result,
}: {
  element: StorybookDocumentElement;
  result?: StorybookVariable;
}): JSX.Element | null {
  if (result == null) {
    return null;
  }
  switch (element.type) {
    case 'markdown': {
      // we should parse markdown with a strict subset of options directly to JSX with a library like this:
      // https://github.com/rexxars/commonmark-react-renderer
      return <div> {result.value as JSX.Element} </div>;
    }
    case 'csv': {
      return (
        <table>
          <tbody>
            {(result.value as string[][]).map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    className={css`
                      padding: 5px;
                    `}
                    key={ci}
                  >
                    {c as string}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
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
          <div>datasource: {element.datasource}</div>
          <div>
            query: <pre>{JSON.stringify(element.query)}</pre>
          </div>
        </>
      );
    }
  }
}

function ShowStorybookDocumentElementEditor({ element }: { element: StorybookDocumentElement }): JSX.Element {
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

/// Transforms a document into an evaledDocument (has results)
function evaluateDocument(
  runner: QueryRunner,
  doc: UnevaluatedStorybookDocument
): Observable<EvaluatedStorybookDocument> {
  const result: EvaluatedStorybookDocument = {
    status: 'evaluating',
    context: {},
    elements: doc.elements,
  };

  const obs: Observable<EvaluatedStorybookDocument> = from<StorybookDocumentElement[]>(doc.elements).pipe(
    concatMap(async (v: StorybookDocumentElement) => {
      console.log('Evaluating %s with context %o', v.id, result.context);
      const res = await evaluateElement(runner, result.context, v);
      result.context[v.id] = res;
      return { ...result };
    })
  );

  return obs;
}

const locationSrv = getLocationSrv();

function useRunner() {
  const runner = useMemo(() => createQueryRunner(), []);

  useEffect(() => {
    const toDestroy = runner;
    return () => {
      return toDestroy.destroy();
    };
  }, [runner]);

  return runner;
}

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

  const runner = useRunner();
  const evaled = useMemo(() => evaluateDocument(runner, document), [runner]);
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
                <ShowStorybookDocumentElementEditor element={m} />
                <ShowStorybookDocumentElementResult element={m} result={evaluation?.context[m.id]} />
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
