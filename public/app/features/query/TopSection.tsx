import React, { FC } from 'react';
import { DataSourceApi, DataSourceSelectItem, GrafanaTheme, PanelData } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Button, Field, stylesFactory, useStyles } from '@grafana/ui';
import { DataSourcePicker } from 'app/core/components/Select/DataSourcePicker';
import { QueryOptions } from '../dashboard/panel_editor/QueryOptions';
import { PanelModel } from '../dashboard/state';
import { css } from 'emotion';

interface Props {
  panel: PanelModel;
  dataSource?: DataSourceApi;
  dataSourceItem: DataSourceSelectItem;
  dataSourceError?: string;
  data: PanelData;
  dataSources: DataSourceSelectItem[];
  onChangeDataSource: (newDataSourceItem: DataSourceSelectItem) => void;
  toggleHelp: () => void;
  openQueryInspector: () => void;
}

export const TopSection: FC<Props> = ({
  panel,
  dataSource,
  dataSourceItem,
  dataSourceError,
  data,
  dataSources,
  onChangeDataSource,
  toggleHelp,
  openQueryInspector,
}) => {
  const styles = useStyles(getStyles);

  if (!dataSource) {
    return null;
  }

  return (
    <div>
      <div className={styles.dataSourceRow}>
        <div className={styles.dataSourceRowItem}>
          <Field invalid={!!dataSourceError} error={dataSourceError}>
            <DataSourcePicker datasources={dataSources} onChange={onChangeDataSource} current={dataSourceItem} />
          </Field>
        </div>
        <div className={styles.dataSourceRowItem}>
          <Button variant="secondary" icon="question-circle" title="Open data source help" onClick={toggleHelp} />
        </div>
        <div className={styles.dataSourceRowItemOptions}>
          <QueryOptions panel={panel} dataSource={dataSource} data={data} />
        </div>
        <div className={styles.dataSourceRowItem}>
          <Button
            variant="secondary"
            onClick={openQueryInspector}
            aria-label={selectors.components.QueryTab.queryInspectorButton}
          >
            Query inspector
          </Button>
        </div>
      </div>
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    dataSourceRow: css`
      display: flex;
      margin-bottom: ${theme.spacing.md};
    `,
    dataSourceRowItem: css`
      margin-right: ${theme.spacing.inlineFormMargin};
    `,
    dataSourceRowItemOptions: css`
      flex-grow: 1;
      margin-right: ${theme.spacing.inlineFormMargin};
    `,
  };
});
