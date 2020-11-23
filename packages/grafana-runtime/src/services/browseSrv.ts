import { BrowseRequest, BrowseResponseRow, DataFrameView, SelectableValue } from '@grafana/data';
import { Observable } from 'rxjs';

/**
 * @alpha -- experimental
 */
export interface BrowseSrv {
  /**
   * Find the root scope names
   */
  getRootScopes(pluginId: number): Observable<Array<SelectableValue<string>>>;

  /**
   * Browse by path
   */
  browse<T>(req: BrowseRequest): Observable<DataFrameView<BrowseResponseRow<T>>>;
}

let singletonInstance: BrowseSrv;

/**
 * Used during startup by Grafana to set the BrowseSrv so it is available
 * via the {@link getBrowseSrv} to the rest of the application.
 *
 * @internal
 */
export function setBrowseSrv(instance: BrowseSrv) {
  singletonInstance = instance;
}

/**
 * Used to retrieve the {@link BrowseSrv} that can be used to automatically navigate
 * the user to a new place in Grafana.
 *
 * @alpha -- experimental
 */
export function getBrowseSrv(): BrowseSrv {
  return singletonInstance;
}
