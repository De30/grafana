import React from 'react';
import Datasource from '../datasource';
import { AzureMonitorQuery, AzureQueryType, Option } from '../types';
// import MetricsQueryEditor from './MetricsQueryEditor';
import NewMetricsQueryEditor from './MetricsQueryEditor/NewMetricsQueryEditor.tsx';
import QueryTypeField from './QueryTypeField';

interface BaseQueryEditorProps {
  query: AzureMonitorQuery;
  datasource: Datasource;
  onChange: (newQuery: AzureMonitorQuery) => void;
  variableOptionGroup: { label: string; options: Option[] };
}

const QueryEditor: React.FC<BaseQueryEditorProps> = ({ query, datasource, onChange }) => {
  const subscriptionId = query.subscription || datasource.azureMonitorDatasource.subscriptionId;
  const variableOptionGroup = {
    label: 'Template Variables',
    options: datasource.getVariables().map((v) => ({ label: v, value: v })),
  };

  return (
    <div data-testid="azure-monitor-query-editor">
      <EditorForQueryType
        subscriptionId={subscriptionId}
        query={query}
        datasource={datasource}
        onChange={onChange}
        variableOptionGroup={variableOptionGroup}
      >
        <QueryTypeField query={query} onQueryChange={onChange} width={24} />
      </EditorForQueryType>
    </div>
  );
};

interface EditorForQueryTypeProps extends BaseQueryEditorProps {
  subscriptionId: string;
}

const EditorForQueryType: React.FC<EditorForQueryTypeProps> = ({
  subscriptionId,
  query,
  datasource,
  variableOptionGroup,
  children,
  onChange,
}) => {
  switch (query.queryType) {
    case AzureQueryType.AzureMonitor:
      return (
        <>
          <NewMetricsQueryEditor
            subscriptionId={subscriptionId}
            query={query}
            datasource={datasource}
            onChange={onChange}
            variableOptionGroup={variableOptionGroup}
          >
            {children}
          </NewMetricsQueryEditor>
          {/* <hr></hr>
          <MetricsQueryEditor
            subscriptionId={subscriptionId}
            query={query}
            datasource={datasource}
            onChange={onChange}
            variableOptionGroup={variableOptionGroup}
          >
            {children}
          </MetricsQueryEditor> */}
        </>
      );
  }

  return null;
};

export default QueryEditor;
