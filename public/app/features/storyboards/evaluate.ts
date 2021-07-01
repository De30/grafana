import { Observable, from } from 'rxjs';
import { concatMap, filter, first } from 'rxjs/operators';
import { rangeUtil, QueryRunner } from '@grafana/data';
import {
  StoryboardContext,
  StoryboardDocumentElement,
  StoryboardVariable,
  UnevaluatedStoryboardDocument,
  EvaluatedStoryboardDocument,
} from './types';

import PyWorker from './web-workers/pyodide.worker';

export async function evaluateElement(
  runner: QueryRunner,
  context: StoryboardContext,
  n: StoryboardDocumentElement
): Promise<StoryboardVariable> {
  switch (n.type) {
    case 'markdown': {
      // value should be JSX:  https://github.com/rexxars/commonmark-react-renderer
      return { value: n.content };
    }
    case 'query': {
      try {
        runner.run({
          timeRange: rangeUtil.convertRawToRange(n.timeRange),
          queries: [n.query],
          datasource: n.datasource,
          timezone: '',
          maxDataPoints: 100,
          minInterval: null,
        });
        const value = await runner
          .get()
          .pipe(
            filter((ev) => ev.state === 'Done'),
            first()
          )
          .toPromise();
        // Need to deep copy to avoid DOMException: object could not be cloned.
        return { value: JSON.parse(JSON.stringify(value)) };
      } catch (e) {
        console.error('TEMP ERROR HANDLER: ', e);
        return { value: undefined };
      }
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

/// Transforms a document into an evaledDocument (has results)
export function evaluateDocument(
  runner: QueryRunner,
  doc: UnevaluatedStoryboardDocument
): Observable<EvaluatedStoryboardDocument> {
  const result: EvaluatedStoryboardDocument = {
    status: 'evaluating',
    context: {},
    elements: doc.elements,
  };

  const obs: Observable<EvaluatedStoryboardDocument> = from<StoryboardDocumentElement[]>(doc.elements).pipe(
    concatMap(async (v: StoryboardDocumentElement) => {
      console.log('Evaluating %s with context %o', v.id, result.context);
      const res = await evaluateElement(runner, result.context, v);
      result.context[v.id] = res;
      return { ...result };
    })
  );

  return obs;
}

let pyodideWorker: Worker | undefined = undefined;
pyodideWorker = (() => {
  if (pyodideWorker == null) {
    return new PyWorker();
  }
  return pyodideWorker;
})();

export function runCallback(
  script: string,
  context: StoryboardContext,
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

export function run(script: string, context: StoryboardContext): Promise<any> {
  return new Promise(function (onSuccess, onError) {
    runCallback(script, context, onSuccess, onError);
  });
}
