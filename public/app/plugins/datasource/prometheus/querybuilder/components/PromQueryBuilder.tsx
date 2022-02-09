import React, { useState, useEffect } from 'react';
import { MetricSelect } from './MetricSelect';
import { PromVisualQuery } from '../types';
import { LabelFilters } from '../shared/LabelFilters';
import { OperationList } from '../shared/OperationList';
import { EditorRow } from '@grafana/experimental';
import { PrometheusDatasource } from '../../datasource';
import { NestedQueryList } from './NestedQueryList';
import { promQueryModeller } from '../PromQueryModeller';
import { QueryBuilderLabelFilter } from '../shared/types';
import { DataFrame, DataSourceApi, SelectableValue } from '@grafana/data';
import { OperationsEditorRow } from '../shared/OperationsEditorRow';
import { Button, Tooltip } from '@grafana/ui';

export interface Props {
  query: PromVisualQuery;
  datasource: PrometheusDatasource;
  onChange: (update: PromVisualQuery) => void;
  onRunQuery: () => void;
  nested?: boolean;
  series?: DataFrame[];
}

export const PromQueryBuilder = React.memo<Props>(({ datasource, query, onChange, onRunQuery, series }) => {
  const [hints, setHints] = useState<JSX.Element[] | undefined>();

  useEffect(() => {
    if (!query.operations.length) {
      const onAddOperation = (value: string) => {
        const operationDef = promQueryModeller.getOperationDef(value);
        onChange(operationDef.addOperationHandler(operationDef, query, promQueryModeller));
      };

      const hints = datasource.getQueryHints({ expr: query.metric, refId: 'A' }, series || []);
      const hintElements = hints.map((hint) => (
        <Tooltip content={`${hint.label} ${hint.fix?.label}`} key={hint.type}>
          <Button onClick={() => onAddOperation(hint.type.split('_')[1].toLowerCase() || '')} variant="secondary">
            {hint.type?.toLowerCase().replace('_', ' ')}
          </Button>
        </Tooltip>
      ));
      setHints(hintElements);
    } else {
      setHints(undefined);
    }
  }, [query, datasource, series, onChange]);

  const onChangeLabels = (labels: QueryBuilderLabelFilter[]) => {
    onChange({ ...query, labels });
  };

  const withTemplateVariableOptions = async (optionsPromise: Promise<string[]>): Promise<SelectableValue[]> => {
    const variables = datasource.getVariables();
    const options = await optionsPromise;
    return [...variables, ...options].map((value) => ({ label: value, value }));
  };

  const onGetLabelNames = async (forLabel: Partial<QueryBuilderLabelFilter>): Promise<string[]> => {
    // If no metric we need to use a different method
    if (!query.metric) {
      // Todo add caching but inside language provider!
      await datasource.languageProvider.fetchLabels();
      return datasource.languageProvider.getLabelKeys();
    }

    const labelsToConsider = query.labels.filter((x) => x !== forLabel);
    labelsToConsider.push({ label: '__name__', op: '=', value: query.metric });
    const expr = promQueryModeller.renderLabels(labelsToConsider);
    const labelsIndex = await datasource.languageProvider.fetchSeriesLabels(expr);

    // filter out already used labels
    return Object.keys(labelsIndex).filter(
      (labelName) => !labelsToConsider.find((filter) => filter.label === labelName)
    );
  };

  const onGetLabelValues = async (forLabel: Partial<QueryBuilderLabelFilter>) => {
    if (!forLabel.label) {
      return [];
    }

    // If no metric we need to use a different method
    if (!query.metric) {
      return await datasource.languageProvider.getLabelValues(forLabel.label);
    }

    const labelsToConsider = query.labels.filter((x) => x !== forLabel);
    labelsToConsider.push({ label: '__name__', op: '=', value: query.metric });
    const expr = promQueryModeller.renderLabels(labelsToConsider);
    const result = await datasource.languageProvider.fetchSeriesLabels(expr);
    const forLabelInterpolated = datasource.interpolateString(forLabel.label);
    return result[forLabelInterpolated] ?? [];
  };

  const onGetMetrics = async () => {
    if (query.labels.length > 0) {
      const expr = promQueryModeller.renderLabels(query.labels);
      return (await datasource.languageProvider.getSeries(expr, true))['__name__'] ?? [];
    } else {
      return (await datasource.languageProvider.getLabelValues('__name__')) ?? [];
    }
  };

  return (
    <>
      <EditorRow>
        <MetricSelect
          query={query}
          onChange={onChange}
          onGetMetrics={() => withTemplateVariableOptions(onGetMetrics())}
        />
        <LabelFilters
          labelsFilters={query.labels}
          onChange={onChangeLabels}
          onGetLabelNames={(forLabel: Partial<QueryBuilderLabelFilter>) =>
            withTemplateVariableOptions(onGetLabelNames(forLabel))
          }
          onGetLabelValues={(forLabel: Partial<QueryBuilderLabelFilter>) =>
            withTemplateVariableOptions(onGetLabelValues(forLabel))
          }
        />
      </EditorRow>
      <OperationsEditorRow>
        <OperationList<PromVisualQuery>
          queryModeller={promQueryModeller}
          datasource={datasource as DataSourceApi}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
          hints={hints}
        />
        {query.binaryQueries && query.binaryQueries.length > 0 && (
          <NestedQueryList query={query} datasource={datasource} onChange={onChange} onRunQuery={onRunQuery} />
        )}
      </OperationsEditorRow>
    </>
  );
});

PromQueryBuilder.displayName = 'PromQueryBuilder';
