import React from 'react';
import { TextArea } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Project, AliasBy } from '.';
import { MQLQuery } from '../types';
import CloudMonitoringDatasource from '../datasource';

export interface Props {
  variableOptionGroup: SelectableValue<string>;
  onChange: (query: MQLQuery) => void;
  onRunQuery: () => void;
  query: MQLQuery;
  datasource: CloudMonitoringDatasource;
}

export const defaultQuery: (dataSource: CloudMonitoringDatasource) => MQLQuery = dataSource => ({
  projectName: dataSource.getDefaultProject(),
  query: '',
  aliasBy: '',
});

export function MQLQueryEditor({
  query,
  datasource,
  onChange,
  onRunQuery,
  variableOptionGroup,
}: React.PropsWithChildren<Props>) {
  return (
    <>
      <Project
        templateVariableOptions={variableOptionGroup.options}
        projectName={query.projectName}
        datasource={datasource}
        onChange={projectName => onChange({ ...query, projectName })}
      />

      <TextArea
        name="Query"
        value={query.query}
        rows={10}
        placeholder=""
        onBlur={onRunQuery}
        onChange={e => onChange({ ...query, query: e.currentTarget.value })}
      />

      <AliasBy value={query.aliasBy} onChange={aliasBy => onChange({ ...query, aliasBy })} />
    </>
  );
}
