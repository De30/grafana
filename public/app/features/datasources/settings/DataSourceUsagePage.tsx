import React, { PureComponent } from 'react';
// Components
import Page from 'app/core/components/Page/Page';
import AutoSizer from 'react-virtualized-auto-sizer';

// Actions & selectors
import { getDataSource, getDataSourceMeta } from '../state/selectors';
import {
  deleteDataSource,
  initDataSourceSettings,
  loadDataSource,
  testDataSource,
  updateDataSource,
} from '../state/actions';
import { getNavModel } from 'app/core/selectors/navModel';

// Types
import { StoreState } from 'app/types/';
import { getDataSourceLoadingNav, buildNavModel, getDataSourceNav } from '../state/navModel';
import { dataSourceLoaded, setDataSourceName, setIsDefault } from '../state/reducers';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { connect, ConnectedProps } from 'react-redux';
import { cleanUpAction } from 'app/core/actions/cleanUp';
import { getGrafanaSearcher, QueryResponse } from 'app/features/search/service';
import { Table } from 'app/features/search/page/table/Table';

export interface OwnProps extends GrafanaRouteComponentProps<{ uid: string }> {}

function mapStateToProps(state: StoreState, props: OwnProps) {
  const dataSourceId = props.match.params.uid;
  const params = new URLSearchParams(props.location.search);
  const dataSource = getDataSource(state.dataSources, dataSourceId);
  const { plugin, loadError, loading, testingStatus } = state.dataSourceSettings;
  const page = params.get('page');

  const nav = plugin
    ? getDataSourceNav(buildNavModel(dataSource, plugin), page || 'usage')
    : getDataSourceLoadingNav('usage');

  const navModel = getNavModel(
    state.navIndex,
    page ? `datasource-page-${page}` : `datasource-usage-${dataSourceId}`,
    nav
  );

  return {
    dataSource: getDataSource(state.dataSources, dataSourceId),
    dataSourceMeta: getDataSourceMeta(state.dataSources, dataSource.type),
    dataSourceId: dataSourceId,
    page,
    plugin,
    loadError,
    loading,
    testingStatus,
    navModel,
  };
}

const mapDispatchToProps = {
  deleteDataSource,
  loadDataSource,
  setDataSourceName,
  updateDataSource,
  setIsDefault,
  dataSourceLoaded,
  initDataSourceSettings,
  testDataSource,
  cleanUpAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export type State = {
  results?: QueryResponse;
};

export class DataSourceSettingsPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { initDataSourceSettings, dataSourceId } = this.props;
    initDataSourceSettings(dataSourceId);

    getGrafanaSearcher()
      .search('', {
        datasource: dataSourceId,
      })
      .then((results) => this.setState({ results }));
  }

  componentWillUnmount() {
    this.props.cleanUpAction({
      stateSelector: (state) => state.dataSourceSettings,
    });
  }

  render() {
    const { navModel, loadError, loading } = this.props;
    const { results } = this.state;

    if (loadError) {
      return <div>ERROR</div>;
    }

    const hasResults = Boolean(results?.body?.length);
    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={loading}>
          {results && (
            <div>
              {!hasResults && <div>Datasource not used in any dashboards</div>}

              {hasResults && (
                <AutoSizer style={{ width: '100%', height: '2000px' }}>
                  {({ width }) => {
                    return (
                      <>
                        <Table data={results.body} width={width} />
                      </>
                    );
                  }}
                </AutoSizer>
              )}
            </div>
          )}
        </Page.Contents>
      </Page>
    );
  }
}

export default connector(DataSourceSettingsPage);
