import React, { useEffect } from 'react';

import Datasource from '../../datasource';
import { AzureMonitorQuery, AzureMonitorOption, AzureMonitorErrorish } from '../../types';
// import { useMetricsMetadata } from '../metrics';
import SubscriptionField from '../SubscriptionField';
import ResourceGroupsField from './ResourceGroupsField';
// import MetricNamespaceField from './MetricNamespaceField';
// import ResourceTypeField from './ResourceTypeField';
// import ResourceNameField from './ResourceNameField';
// import MetricNameField from './MetricNameField';
// import AggregationField from './AggregationField';
// import TimeGrainField from './TimeGrainField';
// import DimensionFields from './DimensionFields';
// import TopField from './TopField';
// import LegendFormatField from './LegendFormatField';
import { InlineFieldRow } from '@grafana/ui';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { selectedResourceGroupState, selectedSubscriptionState } from './recoilState';
import { setResourceGroup, setSubscriptionId } from './setQueryValue';

interface MetricsQueryEditorProps {
  query: AzureMonitorQuery;
  datasource: Datasource;
  subscriptionId?: string;
  onChange: (newQuery: AzureMonitorQuery) => void;
  variableOptionGroup: { label: string; options: AzureMonitorOption[] };
  setError: (source: string, error: AzureMonitorErrorish | undefined) => void;
}

const MetricsQueryEditor: React.FC<MetricsQueryEditorProps> = ({
  query,
  datasource,
  subscriptionId,
  variableOptionGroup,
  onChange,
  setError,
}) => {
  const [recoilSubscriptionId, setRecoilSubscriptionId] = useRecoilState(selectedSubscriptionState);
  const [recoilResourceGroup, setRecoilResourceGroup] = useRecoilState(selectedResourceGroupState);

  // Sync query values to recoil state
  useEffect(() => {
    console.log('syncing subscriptionId query -> recoil', { subscriptionId, recoilSubscriptionId });
    setRecoilSubscriptionId(subscriptionId);
  }, [setRecoilSubscriptionId, subscriptionId]);

  useEffect(() => {
    console.log('syncing subscriptionId recoil -> query', { subscriptionId, recoilSubscriptionId });
    onChange(setSubscriptionId(query, recoilSubscriptionId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, recoilSubscriptionId]);

  //
  // this sync stuff causes an infinite loop
  useEffect(() => {
    console.log('syncing resourceGroup query -> recoil', {
      resourceGroup: query.azureMonitor?.resourceGroup,
      recoilResourceGroup,
    });
    setRecoilResourceGroup(query.azureMonitor?.resourceGroup);
  }, [setRecoilResourceGroup, query.azureMonitor?.resourceGroup]);

  useEffect(() => {
    console.log('syncing resourceGroup recoil -> query', {
      resourceGroup: query.azureMonitor?.resourceGroup,
      recoilResourceGroup,
    });
    onChange(setResourceGroup(query, recoilResourceGroup));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, recoilResourceGroup]);

  // const metricsMetadata = useMetricsMetadata(datasource, query, subscriptionId, onChange);
  // const setDatasource = useSetRecoilState(datasourceState);

  // useEffect(() => {
  //   console.log('going to set datasource......');
  //   setDatasource(datasource);
  // }, [setDatasource, datasource]);

  return (
    <div data-testid="azure-monitor-metrics-query-editor">
      <InlineFieldRow>
        <SubscriptionField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />

        <ResourceGroupsField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />
      </InlineFieldRow>

      {/* <InlineFieldRow>
        <ResourceTypeField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />
        <ResourceNameField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />
      </InlineFieldRow>

      <InlineFieldRow>
        <MetricNamespaceField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />
        <MetricNameField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
        />
      </InlineFieldRow>
      <InlineFieldRow>
        <AggregationField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
          aggregationOptions={metricsMetadata?.aggOptions ?? []}
          isLoading={metricsMetadata.isLoading}
        />
        <TimeGrainField
          query={query}
          datasource={datasource}
          subscriptionId={subscriptionId}
          variableOptionGroup={variableOptionGroup}
          onQueryChange={onChange}
          setError={setError}
          timeGrainOptions={metricsMetadata?.timeGrains ?? []}
        />
      </InlineFieldRow>
      <DimensionFields
        query={query}
        datasource={datasource}
        subscriptionId={subscriptionId}
        variableOptionGroup={variableOptionGroup}
        onQueryChange={onChange}
        setError={setError}
        dimensionOptions={metricsMetadata?.dimensions ?? []}
      />
      <TopField
        query={query}
        datasource={datasource}
        subscriptionId={subscriptionId}
        variableOptionGroup={variableOptionGroup}
        onQueryChange={onChange}
        setError={setError}
      />
      <LegendFormatField
        query={query}
        datasource={datasource}
        subscriptionId={subscriptionId}
        variableOptionGroup={variableOptionGroup}
        onQueryChange={onChange}
        setError={setError}
      /> */}
    </div>
  );
};

export default MetricsQueryEditor;
function useRecoilSetState(selectedSubscriptionState: any) {
  throw new Error('Function not implemented.');
}
