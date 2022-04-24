import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import Page from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { getNavModel } from 'app/core/selectors/navModel';
import { PluginDashboard, StoreState } from 'app/types';

import { importDashboard, removeDashboard } from '../dashboard/state/actions';
import { loadPluginDashboards } from '../plugins/admin/state/actions';

import DashboardTable from './DashboardsTable';
import { initDataSourceSettings, loadDataSource } from './state/actions';
import { buildNavModel, getDataSourceLoadingNav } from './state/navModel';
import { getDataSource } from './state/selectors';

export interface OwnProps extends GrafanaRouteComponentProps<{ uid: string }> {}

function mapStateToProps(state: StoreState, props: OwnProps) {
  const dataSourceId = props.match.params.uid;
  const { plugin } = state.dataSourceSettings;

  const dataSource = getDataSource(state.dataSources, dataSourceId);
  const navModel = getNavModel(state.navIndex, 'datasources');
  navModel.node.active = false;

  navModel.node = plugin
    ? buildNavModel(dataSource, plugin, 'datasource-dashboards', navModel.node)
    : getDataSourceLoadingNav('datasource-dashboards', navModel.node);

  return {
    navModel,
    dashboards: state.plugins.dashboards,
    dataSource: getDataSource(state.dataSources, dataSourceId),
    isLoading: state.plugins.isLoadingPluginDashboards,
    dataSourceId,
  };
}

const mapDispatchToProps = {
  importDashboard,
  loadDataSource,
  initDataSourceSettings,
  loadPluginDashboards,
  removeDashboard,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export class DataSourceDashboards extends PureComponent<Props> {
  async componentDidMount() {
    const { loadDataSource, dataSourceId, initDataSourceSettings } = this.props;
    await loadDataSource(dataSourceId);
    await initDataSourceSettings(dataSourceId);
    this.props.loadPluginDashboards();
  }

  onImport = (dashboard: PluginDashboard, overwrite: boolean) => {
    const { dataSource, importDashboard } = this.props;
    const data: any = {
      pluginId: dashboard.pluginId,
      path: dashboard.path,
      overwrite,
      inputs: [],
    };

    if (dataSource) {
      data.inputs.push({
        name: '*',
        type: 'datasource',
        pluginId: dataSource.type,
        value: dataSource.name,
      });
    }

    importDashboard(data, dashboard.title);
  };

  onRemove = (dashboard: PluginDashboard) => {
    this.props.removeDashboard(dashboard.uid);
  };

  render() {
    const { dashboards, navModel, isLoading } = this.props;
    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={isLoading}>
          <DashboardTable
            dashboards={dashboards}
            onImport={(dashboard, overwrite) => this.onImport(dashboard, overwrite)}
            onRemove={(dashboard) => this.onRemove(dashboard)}
          />
        </Page.Contents>
      </Page>
    );
  }
}

export default connector(DataSourceDashboards);
