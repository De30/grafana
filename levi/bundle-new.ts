export interface DataSourceRef {
  /** The plugin type-id */
  type?: string;
  /** Specific datasource instance */
  uid?: string;
}

export declare function isDataSourceRef(ref: DataSourceRef | string | null): ref is DataSourceRef;
export declare function getDataSourceUID(ref: DataSourceRef | string | null): string | undefined;
