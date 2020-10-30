import React, { PureComponent } from 'react';
import { css } from 'emotion';
import {
  DataQuery,
  DataSourceApi,
  DataSourceSelectItem,
  DefaultTimeRange,
  LoadingState,
  PanelData,
} from '@grafana/data';
import { getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { Button, HorizontalGroup, Modal, stylesFactory } from '@grafana/ui';
import { TopSection } from './TopSection';
import { Queries } from './Queries';
import { config } from 'app/core/config';
import { PluginHelp } from 'app/core/components/PluginHelp/PluginHelp';
import { expressionDatasource, ExpressionDatasourceID } from '../expressions/ExpressionDatasource';
import { getDatasourceSrv } from '../plugins/datasource_srv';
import { DashboardModel, PanelModel } from '../dashboard/state';
import { isSharedDashboardQuery } from '../../plugins/datasource/dashboard';
import { selectors } from '@grafana/e2e-selectors';
import { addQuery } from '../../core/utils/query';
import { DataSourcePicker } from '../../core/components/Select/DataSourcePicker';

interface OwnProps {
  dashboard: DashboardModel;
  panel: PanelModel;
}

type Props = OwnProps;

interface State {
  dataSource?: DataSourceApi;
  dataSourceItem: DataSourceSelectItem;
  dataSourceError?: string;
  data: PanelData;
  isHelpOpen: boolean;
  scrollTop: number;
  isAddingMixed: boolean;
}

export class QueriesContainer extends PureComponent<Props> {
  dataSources: DataSourceSelectItem[] = getDatasourceSrv().getMetricSources();

  state: State = {
    dataSourceItem: this.findCurrentDataSource(),
    data: {
      state: LoadingState.NotStarted,
      series: [],
      timeRange: DefaultTimeRange,
    },
    isHelpOpen: false,
    scrollTop: 0,
    isAddingMixed: false,
  };

  async componentDidMount() {
    const { panel } = this.props;

    try {
      const dataSource = await getDataSourceSrv().get(panel.datasource);
      this.setState({ dataSource });
    } catch (error) {
      const dataSource = await getDataSourceSrv().get();
      const dataSourceItem = this.findCurrentDataSource(dataSource.name);
      this.setState({ dataSource, dataSourceError: error?.message, dataSourceItem });
    }
  }

  findCurrentDataSource(dataSourceName: string | null = this.props.panel.datasource): DataSourceSelectItem {
    return this.dataSources.find(datasource => datasource.value === dataSourceName) || this.dataSources[0];
  }

  //Todo: Move this somewhere.
  onChangeDataSource = async (newDataSourceItem: DataSourceSelectItem) => {
    const { panel } = this.props;
    const { dataSourceItem } = this.state;

    // switching to mixed
    if (newDataSourceItem.meta.mixed) {
      // Set the datasource on all targets
      panel.targets.forEach(target => {
        if (target.datasource !== ExpressionDatasourceID) {
          target.datasource = panel.datasource;
          if (!target.datasource) {
            target.datasource = config.defaultDatasource;
          }
        }
      });
    } else if (dataSourceItem) {
      // if switching from mixed
      if (dataSourceItem.meta.mixed) {
        // Remove the explicit datasource
        for (const target of panel.targets) {
          if (target.datasource !== ExpressionDatasourceID) {
            delete target.datasource;
          }
        }
      } else if (dataSourceItem.meta.id !== newDataSourceItem.meta.id) {
        // we are changing data source type, clear queries
        panel.targets = [{ refId: 'A' }];
      }
    }

    const dataSource = await getDataSourceSrv().get(newDataSourceItem.value);

    panel.datasource = newDataSourceItem.value;

    this.setState(
      {
        dataSourceItem: newDataSourceItem,
        dataSource: dataSource,
        dataSourceError: undefined,
      },
      () => panel.refresh()
    );
  };

  onUpdateQueries = (queries: DataQuery[]) => {
    this.props.panel.updateQueries(queries);

    // Need to force update to rerender query rows.
    this.forceUpdate();
  };

  toggleHelp = () => {
    this.setState((prevState: State) => ({ isHelpOpen: !prevState.isHelpOpen }));
  };

  renderMixedPicker = () => {
    // We cannot filter on mixed flag as some mixed data sources like external plugin
    // meta queries data source is mixed but also supports it's own queries
    const filteredDsList = this.dataSources.filter(dataSource => dataSource.meta.id !== 'mixed');

    return (
      <DataSourcePicker
        datasources={filteredDsList}
        onChange={this.onAddMixedQuery}
        current={null}
        autoFocus={true}
        onBlur={this.onMixedPickerBlur}
        openMenuOnFocus={true}
      />
    );
  };

  openQueryInspector = () => {
    const { panel } = this.props;

    getLocationSrv().update({
      query: { inspect: panel.id, inspectTab: 'query' },
      partial: true,
    });
  };

  onScrollBottom = () => {
    this.setState({ scrollTop: 1000 });
  };

  onAddMixedQuery = (datasource: any) => {
    this.props.panel.targets = addQuery(this.props.panel.targets, { datasource: datasource.name });
    this.setState({ isAddingMixed: false, scrollTop: this.state.scrollTop + 10000 });
    this.forceUpdate();
  };

  onMixedPickerBlur = () => {
    this.setState({ isAddingMixed: false });
  };

  onAddQueryClick = () => {
    if (this.state.dataSourceItem.meta.mixed) {
      this.setState({ isAddingMixed: true });
      return;
    }

    this.onUpdateQueries(addQuery(this.props.panel.targets));
    this.onScrollBottom();
  };

  onAddExpressionClick = () => {
    this.onUpdateQueries(addQuery(this.props.panel.targets, expressionDatasource.newQuery()));
    this.onScrollBottom();
  };

  renderAddQueryRow() {
    const { dataSourceItem, isAddingMixed } = this.state;
    const showAddButton = !(isAddingMixed || isSharedDashboardQuery(dataSourceItem.name));

    return (
      <HorizontalGroup spacing="md" align="flex-start">
        {showAddButton && (
          <Button
            icon="plus"
            onClick={this.onAddQueryClick}
            variant="secondary"
            aria-label={selectors.components.QueryTab.addQuery}
          >
            Query
          </Button>
        )}
        {isAddingMixed && this.renderMixedPicker()}
        {config.featureToggles.expressions && (
          <Button icon="plus" onClick={this.onAddExpressionClick} variant="secondary">
            Expression
          </Button>
        )}
      </HorizontalGroup>
    );
  }

  render() {
    const { dashboard, panel } = this.props;
    const { dataSourceItem, data, dataSource, dataSourceError, isHelpOpen } = this.state;
    const styles = getStyles();

    return (
      <div className={styles.innerWrapper}>
        <TopSection
          dataSources={this.dataSources}
          data={data}
          dataSourceItem={dataSourceItem}
          panel={panel}
          dataSource={dataSource}
          dataSourceError={dataSourceError}
          toggleHelp={this.toggleHelp}
          onChangeDataSource={this.onChangeDataSource}
          openQueryInspector={this.openQueryInspector}
        />
        <div className={styles.queriesWrapper}>
          <Queries
            panel={panel}
            dataSourceItem={dataSourceItem}
            data={data}
            dashboard={dashboard}
            onScrollBottom={this.onScrollBottom}
          />
        </div>
        {this.renderAddQueryRow()}
        {isHelpOpen && (
          <Modal title="Data source help" isOpen={true} onDismiss={this.toggleHelp}>
            <PluginHelp plugin={this.state.dataSourceItem.meta} type="query_help" />
          </Modal>
        )}
      </div>
    );
  }
}

const getStyles = stylesFactory(() => {
  const { theme } = config;
  return {
    innerWrapper: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: ${theme.spacing.md};
    `,
    queriesWrapper: css`
      padding-bottom: ${theme.spacing.md};
    `,
  };
});

export default QueriesContainer;
