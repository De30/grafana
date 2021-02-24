import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from 'emotion';
import useClickAway from 'react-use/lib/useClickAway';

import Datasource from '../../datasource';
import { AzureMonitorQuery, Option } from '../../types';
import { useMetricsMetadata } from '../metrics';
import SubscriptionField from '../SubscriptionField';
import MetricNamespaceField from './MetricNamespaceField';
import NamespaceField from './NamespaceField';
import ResourceGroupsField from './ResourceGroupsField';
import ResourceNameField from './ResourceNameField';
import MetricNameField from './MetricNameField';
import AggregationField from './AggregationField';
import TimeGrainField from './TimeGrainField';
import DimensionFields from './DimensionFields';
import TopField from './TopField';
import LegendFormatField from './LegendFormatField';

import { GrafanaTheme } from '@grafana/data';
import { useStyles, Label, styleMixins } from '@grafana/ui';
// import { getFocusStyle, sharedInputStyle } from '../Forms/commonStyles';
import { getFocusStyle, sharedInputStyle } from '@grafana/ui/src/components/Forms/commonStyles';

interface MetricsQueryEditorProps {
  query: AzureMonitorQuery;
  datasource: Datasource;
  subscriptionId: string;
  onChange: (newQuery: AzureMonitorQuery) => void;
  variableOptionGroup: { label: string; options: Option[] };
}

interface FieldGroupProps {
  focused: boolean;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ children, focused }) => {
  const styles = useStyles(getStyles);
  const ref = useRef(null);
  const [focus, setFocus] = useState(focused);
  useClickAway(ref, () => {
    setFocus(false);
  });
  useEffect(() => {
    setFocus(focused);
  }, [focused]);
  return (
    <div ref={ref} className={cx(styles.Group, focus && styles.Current)} onClick={() => setFocus(true)}>
      {children}
    </div>
  );
};

enum Groups {
  Query,
  Metric,
  Aggregation,
  Filter,
  Legend,
}

const NewMetricsQueryEditor: React.FC<MetricsQueryEditorProps> = ({
  query,
  datasource,
  subscriptionId,
  variableOptionGroup,
  children,
  onChange,
}) => {
  const metricsMetadata = useMetricsMetadata(datasource, query, subscriptionId, onChange);
  const styles = useStyles(getStyles);
  const ref = useRef<HTMLDivElement>(null);
  const [focusedGroup, setFocusedGroup] = useState(Groups.Metric);

  return (
    <div ref={ref}>
      <div className={cx(styles.QueryEditorRow)}>
        <div>
          <Label className={cx(styles.GroupLabel)}>Query Type</Label>
          <div
            className={cx(
              styles.Group,
              css`
                flex-direction: row;
              `
            )}
          >
            {children}
          </div>
        </div>
      </div>
      <div className={cx(styles.QueryEditorRow)} data-testid="azure-monitor-metrics-query-editor">
        <div>
          <Label className={cx(styles.GroupLabel)}>Metric</Label>
          <FieldGroup focused={focusedGroup === Groups.Metric}>
            <SubscriptionField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              onQueryChange={(query) => {
                onChange(query);
                if (query.azureMonitor.resourceGroup === 'select' && ref && ref.current) {
                  const elem = ref.current.querySelector('#azure-monitor-metrics-resource-group-field') as HTMLElement;
                  elem && elem.focus();
                }
              }}
              width={24}
            />
            <ResourceGroupsField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={(query) => {
                onChange(query);
                if (query.azureMonitor.metricNamespace === 'select' && ref && ref.current) {
                  const elem = ref.current.querySelector('#azure-monitor-metrics-namespace-field') as HTMLElement;
                  elem && elem.focus();
                }
              }}
            />

            <NamespaceField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={(query) => {
                onChange(query);
                if (query.azureMonitor.resourceName === 'select' && ref && ref.current) {
                  const elem = ref.current.querySelector('#azure-monitor-metrics-resource-name-field') as HTMLElement;
                  elem && elem.focus();
                }
              }}
            />

            <ResourceNameField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={(query) => {
                onChange(query);
                if (query.azureMonitor.metricNamespace === 'select' && ref && ref.current) {
                  const elem = ref.current.querySelector(
                    '#azure-monitor-metrics-metric-namespace-field'
                  ) as HTMLElement;
                  elem && elem.focus();
                }
              }}
            />

            {/* TODO: Can we hide this field if there's only one option, and its the same as the namespace? */}
            <MetricNamespaceField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={(query) => {
                onChange(query);
                if (query.azureMonitor.metricName === 'select' && ref && ref.current) {
                  const elem = ref.current.querySelector('#azure-monitor-metrics-metric-field') as HTMLElement;
                  elem && elem.focus();
                }
              }}
            />

            <MetricNameField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={(query) => {
                onChange(query);
                if (ref && ref.current) {
                  // if (!query.azureMonitor.aggregation) {
                  //   const elem = ref.current.querySelector('#azure-monitor-metrics-aggregation-field') as HTMLElement;
                  //   elem && elem.focus();
                  // }
                  const elem = ref.current.querySelector('#azure-monitor-metrics-metric-field') as HTMLElement;
                  elem && elem.blur();
                  setFocusedGroup(Groups.Aggregation);
                }
              }}
            />
          </FieldGroup>
        </div>

        <div>
          <Label className={cx(styles.GroupLabel)}>Aggregation</Label>
          <FieldGroup focused={focusedGroup === Groups.Aggregation}>
            <AggregationField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={onChange}
              aggregationOptions={metricsMetadata?.aggOptions ?? []}
            />

            <TimeGrainField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={onChange}
              timeGrainOptions={metricsMetadata?.timeGrains ?? []}
            />
          </FieldGroup>
        </div>

        <div>
          <Label className={cx(styles.GroupLabel)}>Filter</Label>
          <FieldGroup focused={focusedGroup === Groups.Filter}>
            <DimensionFields
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={onChange}
              dimensionOptions={metricsMetadata?.dimensions ?? []}
            />
            <TopField
              query={query}
              datasource={datasource}
              subscriptionId={subscriptionId}
              variableOptionGroup={variableOptionGroup}
              width={24}
              onQueryChange={onChange}
            />
          </FieldGroup>
        </div>

        <div className={cx(styles.QueryEditorRow)} data-testid="azure-monitor-metrics-query-editor">
          <div>
            <Label className={cx(styles.GroupLabel)}>Legend</Label>
            <FieldGroup focused={focusedGroup === Groups.Legend}>
              <LegendFormatField
                query={query}
                datasource={datasource}
                subscriptionId={subscriptionId}
                variableOptionGroup={variableOptionGroup}
                width={24}
                onQueryChange={onChange}
              />
            </FieldGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme) => {
  return {
    QueryEditorRow: css`
      margin-top: 12px;
      display: flex;
      align-items: baseline;
      text-align: left;
      position: relative;
      flex-direction: row;
    `,
    GroupLabel: css`
      padding: 4px 0;
    `,
    Group: cx(
      css`
        ${getFocusStyle(theme)};
        ${sharedInputStyle(theme)};
        /* ${styleMixins.focusCss(theme)}; */
        display: flex;
        flex-direction: column;
        border-radius: ${theme.border.radius.sm};
        padding: 8px 4px 4px 8px;
        border-color: ${theme.colors.formInputBorder};
        background: transparent;
        margin-right: 8px;
      `
    ),
    Current: css`
      ${styleMixins.focusCss(theme)};
    `,
  };
};

export default NewMetricsQueryEditor;
