import React, { PureComponent, RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { DataSourceInstanceSettings, RawTimeRange } from '@grafana/data';
import { config, reportInteraction } from '@grafana/runtime';
import {
  defaultIntervals,
  PageToolbar,
  RefreshPicker,
  SetInterval,
  ToolbarButton,
  ToolbarButtonRow,
} from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { createAndCopyShortLink } from 'app/core/utils/shortLinks';
import { ExploreId } from 'app/types/explore';
import { StoreState } from 'app/types/store';

import { DashNavButton } from '../dashboard/components/DashNav/DashNavButton';
import { getTimeSrv } from '../dashboard/services/TimeSrv';
import { updateFiscalYearStartMonthForSession, updateTimeZoneForSession } from '../profile/state/reducers';
import { getFiscalYearStartMonth, getTimeZone } from '../profile/state/selectors';

import { ExploreTimeControls } from './ExploreTimeControls';
import { LiveTailButton } from './LiveTailButton';
import { changeDatasource } from './state/datasource';
import { splitClose, splitOpen, maximizePaneAction, evenPaneResizeAction } from './state/main';
import { cancelQueries, runQueries } from './state/query';
import { isSplit } from './state/selectors';
import { syncTimes, changeRefreshInterval } from './state/time';
import { LiveTailControls } from './useLiveTailControls';

interface OwnProps {
  exploreId: ExploreId;
  onChangeTime: (range: RawTimeRange, changedByScanner?: boolean) => void;
  topOfViewRef: RefObject<HTMLDivElement>;
}

type Props = OwnProps & ConnectedProps<typeof connector>;

class UnConnectedExploreToolbar extends PureComponent<Props> {
  onChangeDatasource = async (dsSettings: DataSourceInstanceSettings) => {
    const { changeDatasource, exploreId } = this.props;
    changeDatasource(exploreId, dsSettings.uid, { importQueries: true });
  };

  onRunQuery = (loading = false) => {
    const { runQueries, cancelQueries, exploreId } = this.props;
    if (loading) {
      return cancelQueries(exploreId);
    } else {
      return runQueries(exploreId);
    }
  };

  onChangeRefreshInterval = (item: string) => {
    const { changeRefreshInterval, exploreId } = this.props;
    changeRefreshInterval(exploreId, item);
  };

  onChangeTimeSync = () => {
    const { syncTimes, exploreId } = this.props;
    syncTimes(exploreId);
  };

  onCopyShortLink = async () => {
    await createAndCopyShortLink(window.location.href);
    reportInteraction('grafana_explore_shortened_link_clicked');
  };

  onOpenSplitView = () => {
    const { split } = this.props;
    split();
    reportInteraction('grafana_explore_split_view_opened', { origin: 'menu' });
  };

  onCloseSplitView = () => {
    const { closeSplit, exploreId } = this.props;
    closeSplit(exploreId);
    reportInteraction('grafana_explore_split_view_closed');
  };

  renderRefreshPicker = (showSmallTimePicker: boolean) => {
    const { loading, refreshInterval, isLive } = this.props;

    let refreshPickerText: string | undefined = loading ? 'Cancel' : 'Run query';
    let refreshPickerTooltip = undefined;
    let refreshPickerWidth = '108px';
    if (showSmallTimePicker) {
      refreshPickerTooltip = refreshPickerText;
      refreshPickerText = undefined;
      refreshPickerWidth = '35px';
    }

    return (
      <RefreshPicker
        key="refreshPicker"
        onIntervalChanged={this.onChangeRefreshInterval}
        value={refreshInterval}
        isLoading={loading}
        text={refreshPickerText}
        tooltip={refreshPickerTooltip}
        intervals={getTimeSrv().getValidIntervals(defaultIntervals)}
        isLive={isLive}
        onRefresh={() => this.onRunQuery(loading)}
        noIntervalPicker={isLive}
        primary={true}
        width={refreshPickerWidth}
      />
    );
  };

  renderActions = () => {
    const {
      splitted,
      isLive,
      exploreId,
      range,
      timeZone,
      fiscalYearStartMonth,
      onChangeTime,
      syncedTimes,
      onChangeTimeZone,
      onChangeFiscalYearStartMonth,
      refreshInterval,
      loading,
      isPaused,
      hasLiveOption,
      containerWidth,
    } = this.props;
    const showSmallTimePicker = splitted || containerWidth < 1210;

    return [
      !isLive && (
        <ExploreTimeControls
          key="timeControls"
          exploreId={exploreId}
          range={range}
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onChangeTime={onChangeTime}
          splitted={splitted}
          syncedTimes={syncedTimes}
          onChangeTimeSync={this.onChangeTimeSync}
          hideText={showSmallTimePicker}
          onChangeTimeZone={onChangeTimeZone}
          onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
        />
      ),

      this.renderRefreshPicker(showSmallTimePicker),

      refreshInterval && (
        <SetInterval key="setInterval" func={this.onRunQuery} interval={refreshInterval} loading={loading} />
      ),

      hasLiveOption && (
        <LiveTailControls key="liveControls" exploreId={exploreId}>
          {(c) => {
            const controls = {
              ...c,
              start: () => {
                reportInteraction('grafana_explore_logs_live_tailing_clicked', {
                  datasourceType: this.props.datasourceType,
                });
                c.start();
              },
            };
            return (
              <LiveTailButton
                splitted={splitted}
                isLive={isLive}
                isPaused={isPaused}
                start={controls.start}
                pause={controls.pause}
                resume={controls.resume}
                stop={controls.stop}
              />
            );
          }}
        </LiveTailControls>
      ),
    ].filter(Boolean);
  };

  render() {
    const { exploreId, splitted, topOfViewRef, largerExploreId, isLive } = this.props;

    const isTopnav = config.featureToggles.topnav;

    const getDashNav = () => (
      <DashNavButton
        key="share"
        tooltip="Copy shortened link"
        icon="share-alt"
        onClick={this.onCopyShortLink}
        aria-label="Copy shortened link"
      />
    );

    const topNavActions = [
      getDashNav(),
      !splitted && (
        <ToolbarButton
          key="split"
          tooltip="Split the pane"
          onClick={this.onOpenSplitView}
          icon="columns"
          disabled={isLive}
        >
          Split
        </ToolbarButton>
      ),
      <div style={{ flex: 1 }} key="spacer" />,
      <ToolbarButtonRow key="actions" alignment="right">
        {this.renderActions()}
      </ToolbarButtonRow>,
    ].filter(Boolean);

    const toolbarLeftItems = [exploreId === ExploreId.left && getDashNav()].filter(Boolean);

    const isLargerExploreId = largerExploreId === exploreId;

    const onClickResize = () => {
      if (isLargerExploreId) {
        this.props.evenPaneResizeAction();
      } else {
        this.props.maximizePaneAction({ exploreId: exploreId });
      }
    };

    const toolbarLeftItemsTopNav = [
      exploreId === ExploreId.left && (
        <AppChromeUpdate actions={[getDashNav(), <div style={{ flex: 1 }} key="spacer" />].filter(Boolean)} />
      ),
      <React.Fragment key="splitActions">
        <ToolbarButton
          tooltip={`${isLargerExploreId ? 'Narrow' : 'Widen'} pane`}
          disabled={isLive}
          onClick={onClickResize}
          icon={
            (exploreId === 'left' && isLargerExploreId) || (exploreId === 'right' && !isLargerExploreId)
              ? 'angle-left'
              : 'angle-right'
          }
        />
        <ToolbarButton tooltip="Close split pane" onClick={this.onCloseSplitView} icon="times">
          Close
        </ToolbarButton>
      </React.Fragment>,
    ].filter(Boolean);

    return isTopnav && !splitted ? (
      <div ref={topOfViewRef}>
        <AppChromeUpdate actions={topNavActions} />
      </div>
    ) : (
      <div ref={topOfViewRef}>
        <PageToolbar
          aria-label="Explore toolbar"
          title={exploreId === ExploreId.left && !isTopnav ? 'Explore' : undefined}
          pageIcon={exploreId === ExploreId.left && !isTopnav ? 'compass' : undefined}
          leftItems={isTopnav ? toolbarLeftItemsTopNav : toolbarLeftItems}
        >
          {this.renderActions()}
        </PageToolbar>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState, { exploreId }: OwnProps) => {
  const { syncedTimes, largerExploreId } = state.explore;
  const exploreItem = state.explore[exploreId]!;
  const { datasourceInstance, datasourceMissing, range, refreshInterval, loading, isLive, isPaused, containerWidth } =
    exploreItem;

  const hasLiveOption = !!datasourceInstance?.meta?.streaming;

  return {
    datasourceMissing,
    datasourceRef: datasourceInstance?.getRef(),
    datasourceType: datasourceInstance?.type,
    loading,
    range,
    timeZone: getTimeZone(state.user),
    fiscalYearStartMonth: getFiscalYearStartMonth(state.user),
    splitted: isSplit(state),
    refreshInterval,
    hasLiveOption,
    isLive,
    isPaused,
    syncedTimes,
    containerWidth,
    largerExploreId,
  };
};

const mapDispatchToProps = {
  changeDatasource,
  changeRefreshInterval,
  cancelQueries,
  runQueries,
  closeSplit: splitClose,
  split: splitOpen,
  syncTimes,
  onChangeTimeZone: updateTimeZoneForSession,
  onChangeFiscalYearStartMonth: updateFiscalYearStartMonthForSession,
  maximizePaneAction,
  evenPaneResizeAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ExploreToolbar = connector(UnConnectedExploreToolbar);
