import React, { ChangeEvent } from 'react';
import { LegacyForms } from '@grafana/ui';
const { Input } = LegacyForms;
import { SelectableValue } from '@grafana/data';
import { Project, AliasBy, QueryInlineField } from '.';
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

      <QueryInlineField label="Query">
        <Input
          className="gf-form-input"
          onBlur={onRunQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...query, query: event.target.value })}
          value={query.query}
        />
      </QueryInlineField>

      <AliasBy value={query.aliasBy} onChange={aliasBy => onChange({ ...query, aliasBy })} />
    </>
  );
}
