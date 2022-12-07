import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { CoreApp, TimeZone } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime/src';
import { TabbedContainer, TabConfig } from '@grafana/ui';
import { ExploreDrawer } from 'app/features/explore/ExploreDrawer';
import { InspectDataTab } from 'app/features/inspector/InspectDataTab';
import { InspectErrorTab } from 'app/features/inspector/InspectErrorTab';
import { InspectJSONTab } from 'app/features/inspector/InspectJSONTab';
import { InspectStatsTab } from 'app/features/inspector/InspectStatsTab';
import { QueryInspector } from 'app/features/inspector/QueryInspector';
import { StoreState, ExploreItemState, ExploreId } from 'app/types';

import { getTimeZone } from '../profile/state/selectors';

import { runQueries } from './state/query';

interface OwnProps {
  width: number;
  exploreId: ExploreId;
  onClose: () => void;
}

type Props = OwnProps & ConnectedProps<typeof connector>;

export function ExploreQueryInspector(props: Props) {
  const { loading, width, onClose, queryResponse, timeZone } = props;
  const dataFrames = queryResponse?.series || [];
  const error = queryResponse?.error;

  useEffect(() => {
    reportInteraction('grafana_explore_query_inspector_opened');
  }, []);

  const statsTab: TabConfig = {
    label: 'Stats',
    value: 'stats',
    icon: 'chart-line',
    content: <InspectStatsTab data={queryResponse!} timeZone={queryResponse?.request?.timezone as TimeZone} />,
  };

  const jsonTab: TabConfig = {
    label: 'JSON',
    value: 'json',
    icon: 'brackets-curly',
    content: <InspectJSONTab data={queryResponse} onClose={onClose} />,
  };

  const dataTab: TabConfig = {
    label: 'Data',
    value: 'data',
    icon: 'database',
    content: (
      <InspectDataTab
        data={dataFrames}
        isLoading={loading}
        options={{ withTransforms: false, withFieldConfig: false }}
        timeZone={timeZone}
        app={CoreApp.Explore}
      />
    ),
  };

  const queryTab: TabConfig = {
    label: 'Query',
    value: 'query',
    icon: 'info-circle',
    content: <QueryInspector data={dataFrames} onRefreshQuery={() => props.runQueries(props.exploreId)} />,
  };

  const tabs = [statsTab, queryTab, jsonTab, dataTab];
  if (error) {
    const errorTab: TabConfig = {
      label: 'Error',
      value: 'error',
      icon: 'exclamation-triangle',
      content: <InspectErrorTab error={error} />,
    };
    tabs.push(errorTab);
  }
  return (
    <ExploreDrawer width={width}>
      <TabbedContainer tabs={tabs} onClose={onClose} closeIconTooltip="Close query inspector" />
    </ExploreDrawer>
  );
}

function mapStateToProps(state: StoreState, { exploreId }: { exploreId: ExploreId }) {
  const explore = state.explore;
  const item: ExploreItemState = explore[exploreId]!;
  const { loading, queryResponse } = item;
  const timeZone = getTimeZone(state.user);

  return {
    loading,
    queryResponse,
    timeZone,
  };
}

const mapDispatchToProps = {
  runQueries,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(ExploreQueryInspector);
