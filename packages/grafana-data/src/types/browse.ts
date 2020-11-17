/**
 * Flag for what the call should do
 *
 * @alpha -- experimental
 */
export enum BrowseAction {
  // List all children of the requested path
  List = 'list',

  // Show details for the requested path
  Details = 'details',
}

/**
 * List values from a DataSource
 *
 * @alpha -- experimental
 */
export interface BrowseRequest {
  /** The datasource or App instance */
  instanceId?: number;

  /** An id that maps to a root path or scope */
  scope: string;

  /** The query request path */
  path: string;

  /** defaults to `list` */
  action?: BrowseAction;

  /** The response should contain as many details as possible */
  verbose?: boolean;

  /** The response should include the raw value for the request */
  values?: boolean;
}

/**
 * Standard expected in the response DataFrame.  This can be used with DataFrameView<BrowseResponseRow>
 * to iterate expected fields from the response
 *
 * @alpha -- experimental
 */
export interface BrowseResponseRow<T = any> {
  name: string;
  path: string;
  size?: number;
  browseable?: boolean; // Can/should add links
  childCount?: number; // when defined, this says how many children exist under this path
  mimeType?: string;

  /** Typically the last modified time */
  time?: number;

  /** When values is true, this will return the real value */
  value?: T;
}
