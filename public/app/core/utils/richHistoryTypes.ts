export enum SortOrder {
  Descending = 'Descending',
  Ascending = 'Ascending',
  /**
   * @deprecated supported only by local storage. It will be removed in the future
   */
  DatasourceAZ = 'Datasource A-Z',
  /**
   * @deprecated supported only by local storage. It will be removed in the future
   */
  DatasourceZA = 'Datasource Z-A',
}

export interface RichHistorySettings {
  retentionPeriod: number;
  starredTabAsFirstTab: boolean;
  activeDatasourceOnly: boolean;
  lastUsedDatasourceFilters?: string[];
}

export type RichHistorySearchFilters = {
  /** Names of data sources (not uids) - used by local and remote storage **/
  from: number;
  to: number;
  datasourceFilters?: string[];
  search?: string;
  sortOrder?: SortOrder;
  starred?: boolean;
  page?: number;
  limit?: number;
  distinct?: boolean;
};
