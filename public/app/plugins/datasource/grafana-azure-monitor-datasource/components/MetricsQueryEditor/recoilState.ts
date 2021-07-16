import { atom, selector } from 'recoil';
import Datasource from '../../datasource';
import { AzureMetricQuery, AzureMonitorOption, AzureMonitorQuery } from '../../types';
import { toOption } from '../../utils/common';

let datasource: Datasource;

export function dangerouslySetDatasource(ds: Datasource) {
  datasource = ds;
}

function dangerouslyGetDatasource() {
  return datasource;
}

export const selectedSubscriptionState = atom<AzureMonitorQuery['subscription']>({
  key: 'az-selected-subscription',
  default: undefined,
});

export const subscriptionsState = selector<AzureMonitorOption[]>({
  key: 'subscriptions',
  get: async ({ get }) => {
    const datasource = dangerouslyGetDatasource();
    console.log('getting subscriptions with datasource', datasource);
    const results = datasource ? await datasource.getSubscriptions() : [];
    return results.map((v) => ({ label: v.text, value: v.value, description: v.value }));
  },
});

export const selectedResourceGroupState = atom<AzureMetricQuery['resourceGroup']>({
  key: 'az-metrics-resourcegroup',
  default: undefined,
});

export const resourceGroupsState = selector<AzureMonitorOption[]>({
  key: 'az-resourcegroups',
  get: async ({ get }) => {
    const subscriptionId = get(selectedSubscriptionState);
    const datasource = dangerouslyGetDatasource();
    if (!subscriptionId || !datasource) {
      return [];
    }

    const results = await datasource.getResourceGroups(subscriptionId);
    return results.map(toOption);
  },
});
