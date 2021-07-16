import React, { useCallback, useMemo } from 'react';
import { SelectableValue } from '@grafana/data';
import { Select, MultiSelect } from '@grafana/ui';

import { AzureMonitorQuery, AzureQueryEditorFieldProps, AzureQueryType } from '../types';
import { Field } from './Field';
import { useRecoilState, useRecoilValue, useRecoilValueLoadable } from 'recoil';
import { selectedSubscriptionState, subscriptionsState } from './MetricsQueryEditor/recoilState';

interface SubscriptionFieldProps extends AzureQueryEditorFieldProps {
  onQueryChange: (newQuery: AzureMonitorQuery) => void;
  multiSelect?: boolean;
}

// const ERROR_SOURCE = 'metrics-subscription';

const SubscriptionField: React.FC<SubscriptionFieldProps> = ({
  query,
  variableOptionGroup,
  onQueryChange,
  setError,
  multiSelect = false,
}) => {
  const [subscriptionId, setSubscriptionId] = useRecoilState(selectedSubscriptionState);
  const subscriptionsLoadable = useRecoilValueLoadable(subscriptionsState);
  const subscriptions = useMemo(
    () => (subscriptionsLoadable.state === 'hasValue' ? subscriptionsLoadable.contents : []),
    [subscriptionsLoadable]
  );

  const handleChange = (change: SelectableValue<string>) => {
    setSubscriptionId(change.value);
  };

  // useEffect(() => {
  //   datasource.azureMonitorDatasource
  //     .getSubscriptions()
  //     .then((results) => {
  //       const newSubscriptions = results.map((v) => ({ label: v.text, value: v.value, description: v.value }));
  //       setSubscriptions(newSubscriptions);
  //       setError(ERROR_SOURCE, undefined);

  //       let newSubscription = query.subscription || datasource.azureMonitorDatasource.defaultSubscriptionId;

  //       if (!newSubscription && newSubscriptions.length > 0) {
  //         newSubscription = newSubscriptions[0].value;
  //       }

  //       if (newSubscription && newSubscription !== query.subscription) {
  //         onQueryChange({
  //           ...query,
  //           subscription: newSubscription,
  //         });
  //       }
  //     })
  //     .catch((err) => setError(ERROR_SOURCE, err));
  // }, [
  //   datasource.azureMonitorDatasource?.defaultSubscriptionId,
  //   datasource.azureMonitorDatasource,
  //   onQueryChange,
  //   query,
  //   setError,
  // ]);

  // const handleChange = useCallback(
  //   (change: SelectableValue<string>) => {
  //     if (!change.value) {
  //       return;
  //     }

  //     let newQuery: AzureMonitorQuery = {
  //       ...query,
  //       subscription: change.value,
  //     };

  //     if (query.queryType === AzureQueryType.AzureMonitor) {
  //       newQuery.azureMonitor = {
  //         ...newQuery.azureMonitor,
  //         resourceGroup: undefined,
  //         metricDefinition: undefined,
  //         metricNamespace: undefined,
  //         resourceName: undefined,
  //         metricName: undefined,
  //         aggregation: undefined,
  //         timeGrain: '',
  //         dimensionFilters: [],
  //       };
  //     }

  //     onQueryChange(newQuery);
  //   },
  //   [query, onQueryChange]
  // );

  const onSubscriptionsChange = useCallback(
    (change: Array<SelectableValue<string>>) => {
      if (!change) {
        return;
      }

      query.subscriptions = change.map((c) => c.value ?? '');
      onQueryChange(query);
    },
    [query, onQueryChange]
  );

  const options = useMemo(() => [...subscriptions, variableOptionGroup], [subscriptions, variableOptionGroup]);

  return multiSelect ? (
    <Field label="Subscriptions">
      <MultiSelect
        isClearable
        value={query.subscriptions}
        inputId="azure-monitor-subscriptions-field"
        onChange={onSubscriptionsChange}
        options={options}
        width={38}
      />
    </Field>
  ) : (
    <Field label="Subscription">
      <Select
        value={subscriptionId}
        inputId="azure-monitor-subscriptions-field"
        onChange={handleChange}
        options={options}
        width={38}
        isLoading={subscriptionsLoadable.state === 'loading'}
      />
    </Field>
  );
};

export default SubscriptionField;
