export interface DataSourceRef {
  /** The plugin type-id */
  type?: string;
  /** Specific datasource instance */
  uid?: string;
}

export declare function isDataSourceRef(ref: DataSourceRef | string | null): string[];

export declare const isTableData: (data: string) => number;
