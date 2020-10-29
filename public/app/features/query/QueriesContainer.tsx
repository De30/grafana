import React, { PureComponent } from 'react';
import { connect, MapStateToProps } from 'react-redux';
import { css } from 'emotion';
import { DataSourceApi, DataSourceSelectItem, DefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { getDataSourceSrv, getLocationSrv } from '@grafana/runtime';
import { Modal, stylesFactory } from '@grafana/ui';
import { TopSection } from './TopSection';
import { config } from 'app/core/config';
import { ExpressionDatasourceID } from '../expressions/ExpressionDatasource';
import { PanelModel } from '../dashboard/state';
import { getDatasourceSrv } from '../plugins/datasource_srv';
import { StoreState } from 'app/types';
import { PluginHelp } from '../../core/components/PluginHelp/PluginHelp';
import { Queries } from './Queries';

interface ConnectedProps {
  panel: PanelModel;
}

type Props = ConnectedProps;

interface State {
  dataSource?: DataSourceApi;
  dataSourceItem: DataSourceSelectItem;
  dataSourceError?: string;
  data: PanelData;
  isHelpOpen: boolean;
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

  toggleHelp = () => {
    this.setState((prevState: State) => ({ isHelpOpen: !prevState.isHelpOpen }));
  };

  openQueryInspector = () => {
    const { panel } = this.props;

    getLocationSrv().update({
      query: { inspect: panel.id, inspectTab: 'query' },
      partial: true,
    });
  };

  render() {
    const { panel } = this.props;
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
          <Queries />
          {isHelpOpen && (
            <Modal title="Data source help" isOpen={true} onDismiss={this.toggleHelp}>
              <PluginHelp plugin={this.state.dataSourceItem.meta} type="query_help" />
            </Modal>
          )}
        </div>
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

const mapStateToProps: MapStateToProps<ConnectedProps, Props, StoreState> = state => {
  return {
    panel: state.panelEditor.getPanel(),
  };
};

export default connect(mapStateToProps)(QueriesContainer);
