import { AzureMetricDimension, AzureMonitorQuery } from '../../types';

export function setSubscriptionId(query: AzureMonitorQuery, subscriptionId: string | undefined): AzureMonitorQuery {
  return {
    ...query,
    subscription: subscriptionId,
  };
}

export function setResourceGroup(query: AzureMonitorQuery, resourceGroupId: string | undefined): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      resourceGroup: resourceGroupId,
    },
  };
}

// In the query as "metricDefinition" for some reason
export function setResourceType(query: AzureMonitorQuery, resourceType: string | undefined): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      metricDefinition: resourceType,
    },
  };
}

export function setResourceName(query: AzureMonitorQuery, resourceName: string | undefined): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      resourceName: resourceName,
    },
  };
}

export function setMetricNamespace(query: AzureMonitorQuery, metricNamespace: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      metricNamespace: metricNamespace,
    },
  };
}

export function setMetricName(query: AzureMonitorQuery, metricName: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      metricName: metricName,
    },
  };
}

export function setAggregation(query: AzureMonitorQuery, aggregation: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      aggregation: aggregation,
    },
  };
}

export function setTimeGrain(query: AzureMonitorQuery, timeGrain: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      timeGrain: timeGrain,
    },
  };
}

export function setDimensionFilters(query: AzureMonitorQuery, dimensions: AzureMetricDimension[]): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      dimensionFilters: dimensions,
    },
  };
}

export function appendDimensionFilter(query: AzureMonitorQuery, dimension: AzureMetricDimension): AzureMonitorQuery {
  return setDimensionFilters(query, [...(query.azureMonitor?.dimensionFilters ?? []), dimension]);
}

export function removeDimensionFilter(query: AzureMonitorQuery, dimensionIndex: number): AzureMonitorQuery {
  const newFilters = (query.azureMonitor?.dimensionFilters ?? []).slice();
  newFilters.splice(dimensionIndex, 1);
  return setDimensionFilters(query, newFilters);
}

export function modifyDimensionFilter<Key extends keyof AzureMetricDimension>(
  query: AzureMonitorQuery,
  dimensionIndex: number,
  fieldName: Key,
  value: AzureMetricDimension[Key]
): AzureMonitorQuery {
  const newFilters = (query.azureMonitor?.dimensionFilters ?? []).slice();
  const newFilter = newFilters[dimensionIndex];
  newFilter[fieldName] = value;

  return setDimensionFilters(query, newFilters);
}

export function setTop(query: AzureMonitorQuery, top: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      top: top,
    },
  };
}

export function setLegendAlias(query: AzureMonitorQuery, alias: string): AzureMonitorQuery {
  return {
    ...query,
    azureMonitor: {
      ...query.azureMonitor,
      alias: alias,
    },
  };
}
