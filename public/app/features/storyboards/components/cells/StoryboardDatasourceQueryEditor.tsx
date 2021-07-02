import React from 'react';
import { useAsync } from 'react-use';

import { DataQuery } from '@grafana/data';
import { getDataSourceSrv, DataSourcePicker } from '@grafana/runtime';

interface QueryEditorProps {
  datasourceUid: string | null;
  query: DataQuery;
  onChangeQuery: (query: DataQuery) => void;
}

const QueryEditor = ({ datasourceUid, query, onChangeQuery }: QueryEditorProps) => {
  const state = useAsync(async () => {
    if (datasourceUid == null || datasourceUid === '') {
      return Promise.resolve(undefined);
    }
    return getDataSourceSrv().get(datasourceUid);
  }, [datasourceUid]);

  // if (datasourceUid == null) {
  //   return null;
  // }

  if (state.loading) {
    return <div>Loading datasource editor</div>;
  }

  if (state.error != null) {
    return <div>Error loading datasource editor</div>;
  }

  const { value: datasource } = state;

  if (datasource == null) {
    return <div>Datasource not found</div>;
  }

  const DSQueryEditor = datasource.components?.QueryEditor;

  if (DSQueryEditor == null) {
    return <div>Query editor not available for datasource</div>;
  }

  return (
    <DSQueryEditor
      // data={data}
      // range={timeRange}
      query={query}
      datasource={datasource}
      onChange={onChangeQuery}
      onRunQuery={() => {}}
    />
  );
};

export interface Props {
  datasourceUidOrName: string;
  onChangeDatasource: (datasource: string) => void;
  query: DataQuery;
  onChangeQuery: (query: DataQuery) => void;
}

export const StoryboardDatasourceQueryEditor = ({
  datasourceUidOrName,
  onChangeDatasource,
  query,
  onChangeQuery,
}: Props) => (
  <div>
    <DataSourcePicker
      noDefault
      onChange={(ds) => onChangeDatasource(ds.uid ?? ds.name)}
      current={datasourceUidOrName}
    />
    <QueryEditor datasourceUid={datasourceUidOrName} query={query} onChangeQuery={onChangeQuery} />;
  </div>
);
