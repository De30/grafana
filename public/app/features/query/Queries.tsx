import React, { PureComponent } from 'react';
import { selectors } from '@grafana/e2e-selectors';
import { DashboardQueryEditor, isSharedDashboardQuery } from 'app/plugins/datasource/dashboard';
import { QueryEditorRows } from './QueryEditorRows';
import { DashboardModel, PanelModel } from '../dashboard/state';
import { DataQuery, DataSourceSelectItem, PanelData } from '@grafana/data';

interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
  data: PanelData;
  dataSourceItem: DataSourceSelectItem;

  onScrollBottom: () => void;
}

export class Queries extends PureComponent<Props> {
  /**
   * Sets the queries for the panel
   */
  onUpdateQueries = (queries: DataQuery[]) => {
    this.props.panel.updateQueries(queries);

    // Need to force update to rerender query rows.
    this.forceUpdate();
  };
  render() {
    const { dashboard, data, dataSourceItem, onScrollBottom, panel } = this.props;

    if (isSharedDashboardQuery(dataSourceItem.name)) {
      return <DashboardQueryEditor panel={panel} panelData={data} onChange={query => this.onUpdateQueries([query])} />;
    }

    return (
      <div aria-label={selectors.components.QueryTab.content}>
        <QueryEditorRows
          queries={panel.targets}
          datasource={dataSourceItem}
          onChangeQueries={this.onUpdateQueries}
          onScrollBottom={onScrollBottom}
          panel={panel}
          dashboard={dashboard}
          data={data}
        />
      </div>
    );
  }
}
