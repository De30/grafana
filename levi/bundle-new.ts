export interface DataSourceRef {
  /** The plugin type-id */
  type?: string;
  /** Specific datasource instance */
  uid?: string;
  foo?: string;
}

export declare function isDataSourceRef(ref: DataSourceRef | string | null, foo?: string): string[];
export declare function getDataSourceUID(ref: DataSourceRef | string | null): string | undefined;

export declare const isTableData: (data: string) => number;
