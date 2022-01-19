import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import memoizeOne from 'memoize-one';
import { DataQuery, EventBusExtended, EventBusSrv, ExplorePaneURLState } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import store from 'app/core/store';
import { lastSavedUrl, cleanupPaneAction } from './state/main';
import { initializeExplore, refreshExplore } from './state/explorePane';
import { ExploreId } from 'app/types/explore';
import { StoreState } from 'app/types';
import {
  DEFAULT_RANGE,
  ensureQueries,
  getTimeRange,
  getTimeRangeFromUrl,
  lastUsedDatasourceKeyForOrgId,
} from 'app/core/utils/explore';
import { getFiscalYearStartMonth, getTimeZone } from '../profile/state/selectors';
import Explore from './Explore';

interface OwnProps {
  exploreId: ExploreId;
  urlState?: ExplorePaneURLState;
  split: boolean;
}

interface Props extends OwnProps, ConnectedProps<typeof connector> {}

/**
 * This component is responsible for handling initialization of an Explore pane and triggering synchronization
 * of state based on URL changes and preventing any infinite loops.
 */
class ExplorePaneContainerUnconnected extends React.PureComponent<Props> {
  el: any;
  exploreEvents: EventBusExtended;

  constructor(props: Props) {
    super(props);
    this.exploreEvents = new EventBusSrv();
    this.state = {
      openDrawer: undefined,
    };
  }

  componentDidMount() {
    const {
      initialized,
      exploreId,
      initialDatasource,
      initialQueries,
      initialRange,
      // TODO: check this
      // originPanelId
    } = this.props;
    const width = this.el?.offsetWidth ?? 0;

    // initialize the whole explore first time we mount and if browser history contains a change in datasource
    if (!initialized) {
      this.props.initializeExplore(
        exploreId,
        initialDatasource,
        initialQueries,
        initialRange,
        width,
        this.exploreEvents
        // TODO: check this
        // originPanelId
      );
    }
  }

  componentWillUnmount() {
    this.exploreEvents.removeAllListeners();
    this.props.cleanupPaneAction({ exploreId: this.props.exploreId });
  }

  componentDidUpdate(prevProps: Props) {
    this.refreshExplore(prevProps.urlState);
  }

  refreshExplore = (prevUrlState: ExplorePaneURLState | undefined) => {
    const { exploreId, urlState } = this.props;

    // Update state from url only if it changed and only if the change wasn't initialised by redux to prevent any loops
    // TODO: this used to work because urlState was a string before, stringifying it seems a bit hacky
    if (
      urlState &&
      JSON.stringify(urlState) !== JSON.stringify(prevUrlState) &&
      JSON.stringify(urlState) !== lastSavedUrl[exploreId]
    ) {
      this.props.refreshExplore(exploreId, urlState);
    }
  };

  getRef = (el: any) => {
    this.el = el;
  };

  render() {
    const exploreClass = this.props.split ? 'explore explore-split' : 'explore';
    return (
      <div className={exploreClass} ref={this.getRef} data-testid={selectors.pages.Explore.General.container}>
        {this.props.initialized && <Explore exploreId={this.props.exploreId} />}
      </div>
    );
  }
}

const ensureQueriesMemoized = memoizeOne(ensureQueries);
const getTimeRangeFromUrlMemoized = memoizeOne(getTimeRangeFromUrl);

function mapStateToProps(state: StoreState, props: OwnProps) {
  const timeZone = getTimeZone(state.user);
  const fiscalYearStartMonth = getFiscalYearStartMonth(state.user);

  const {
    datasource,
    queries,
    range,
    // TODO: check this
    //  originPanelId
  } = props.urlState || {};
  const initialDatasource = datasource || store.get(lastUsedDatasourceKeyForOrgId(state.user.orgId));
  const initialQueries: DataQuery[] = ensureQueriesMemoized(queries);
  const initialRange = range
    ? getTimeRangeFromUrlMemoized(range, timeZone, fiscalYearStartMonth)
    : getTimeRange(timeZone, DEFAULT_RANGE, fiscalYearStartMonth);

  return {
    initialized: state.explore[props.exploreId]?.initialized,
    initialDatasource,
    initialQueries,
    initialRange,
    // TODO: check this
    // originPanelId,
  };
}

const mapDispatchToProps = {
  initializeExplore,
  refreshExplore,
  cleanupPaneAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ExplorePaneContainer = connector(ExplorePaneContainerUnconnected);
