import { DataQuery, DataSourceRef } from '@grafana/data';

export interface QueryGroupOptions {
  queries: DataQuery[];
  drillDownQueries?: Record<string, object[]>;
  dataSource: QueryGroupDataSource;
  maxDataPoints?: number | null;
  minInterval?: string | null;
  cacheTimeout?: string | null;
  timeRange?: {
    from?: string | null;
    shift?: string | null;
    hide?: boolean;
  };
}

export interface QueryGroupDataSource extends DataSourceRef {
  name?: string | null;
  default?: boolean;
}
