import { Observable, from } from 'rxjs';
import { concatMap, filter, first } from 'rxjs/operators';
import { rangeUtil, readCSV, QueryRunner } from '@grafana/data';
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
  let result: StoryboardVariable = { element: n, value: undefined };
  switch (n.type) {
    case 'markdown': {
      // value should be JSX:  https://github.com/rexxars/commonmark-react-renderer
      result.value = n.content;
      break;
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
            filter((ev) => ev.state === 'Done' && ev.series.length > 0 && ev.series[0].refId === n.id),
            first()
          )
          .toPromise();
        result.value = value;
      } catch (e) {
        console.error('TEMP ERROR HANDLER: ', e);
      }
      break;
    }
    case 'csv': {
      // TODO: Use real CSV algorithm to split!
      result.value = readCSV(n.content.text);
      break;
    }
    case 'plaintext': {
      result.value = n.content;
      break;
    }
    case 'python': {
      const runOutput = await run(n.script, context);
      result.value = runOutput.results;
      result.stdout = runOutput.stdout;
      break;
    }
  }
  return result;
}

/// Transforms a document into an evaledDocument (has results)
export function evaluateDocument(
  runner: QueryRunner,
  doc: UnevaluatedStoryboardDocument
): Observable<EvaluatedStoryboardDocument> {
  const result: EvaluatedStoryboardDocument = {
    title: doc.title,
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
  onSuccess: (data: any) => void,
  onError: (ev: ErrorEvent) => any
) {
  if (pyodideWorker == null) {
    return;
  }
  pyodideWorker.onerror = (e) => onError(e);
  pyodideWorker.onmessage = (e) => onSuccess(e.data);
  pyodideWorker.postMessage({
    // Need to deep copy the object to avoid DOMExceptions when objects can't be cloned.
    ...JSON.parse(JSON.stringify(context)),
    python: script,
  });
}

export function run(script: string, context: StoryboardContext): Promise<any> {
  return new Promise(function (onSuccess, onError) {
    runCallback(script, context, onSuccess, onError);
  });
}
