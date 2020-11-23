import { BrowseRequest, BrowseResponseRow, DataFrameView, SelectableValue } from '@grafana/data';
import { BrowseSrv } from '@grafana/runtime';
import { Observable, of, throwError } from 'rxjs';

export class GrafanaBrowseSrv implements BrowseSrv {
  /**
   * Find the root scope names
   */
  getRootScopes(pluginId: number): Observable<Array<SelectableValue<string>>> {
    // TODO, actually query
    return of([
      {
        value: 'a',
        label: 'Root a',
      },
      {
        value: 'b',
        label: 'Root b',
      },
    ]);
  }

  /**
   * Browse by path
   */
  browse<T>(req: BrowseRequest): Observable<DataFrameView<BrowseResponseRow<T>>> {
    console.log('TODO actually query....', req);
    return throwError('not found');
  }
}
