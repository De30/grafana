import { css } from '@emotion/css';
import React, { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { GrafanaTheme2, PageLayoutType, TimeZone } from '@grafana/data';
import { PageToolbar, useStyles2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { updateTimeZoneForSession } from 'app/features/profile/state/reducers';
import { useSelector, useDispatch } from 'app/types';

import { DashNavTimeControls } from '../components/DashNav/DashNavTimeControls';
import { DashboardFailed } from '../components/DashboardLoading/DashboardFailed';
import { DashboardLoading } from '../components/DashboardLoading/DashboardLoading';
import { PublicDashboardFooter } from '../components/PublicDashboardFooter/PublicDashboardsFooter';
import { DashboardGrid } from '../dashgrid/DashboardGrid';
import { getTimeSrv } from '../services/TimeSrv';
import { DashboardModel } from '../state';
import { initDashboard } from '../state/initDashboard';

interface PublicDashboardPageRouteParams {
  accessToken?: string;
}

interface PublicDashboardPageRouteSearchParams {
  from?: string;
  to?: string;
  refresh?: string;
}

export type Props = GrafanaRouteComponentProps<PublicDashboardPageRouteParams, PublicDashboardPageRouteSearchParams>;

const Toolbar = ({ dashboard }: { dashboard: DashboardModel }) => {
  const dispatch = useDispatch();

  const onChangeTimeZone = (timeZone: TimeZone) => {
    dispatch(updateTimeZoneForSession(timeZone));
  };

  return (
    <PageToolbar title={dashboard.title} buttonOverflowAlignment="right">
      {!dashboard.timepicker.hidden && (
        <DashNavTimeControls dashboard={dashboard} onChangeTimeZone={onChangeTimeZone} />
      )}
    </PageToolbar>
  );
};

const PublicDashboardPage = (props: Props) => {
  const { match, route, location } = props;
  const dispatch = useDispatch();
  const context = useGrafana();
  const prevProps = usePrevious(props);
  const styles = useStyles2(getStyles);
  const dashboardState = useSelector((store) => store.dashboard);
  const dashboard = dashboardState.getModel();

  useEffect(() => {
    dispatch(
      initDashboard({
        routeName: route.routeName,
        fixUrl: false,
        accessToken: match.params.accessToken,
        keybindingSrv: context.keybindings,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevProps?.location.search !== location.search) {
      const prevUrlParams = prevProps?.queryParams;
      const urlParams = props.queryParams;

      if (
        (urlParams?.from !== prevUrlParams?.from || urlParams?.to !== prevUrlParams?.to) &&
        !dashboard?.timepicker.hidden
      ) {
        getTimeSrv().updateTimeRangeFromUrl();
      }

      if (!prevUrlParams?.refresh && urlParams?.refresh) {
        getTimeSrv().setAutoRefresh(urlParams.refresh);
      }
    }
  }, [prevProps, location.search, props.queryParams, dashboard?.timepicker.hidden]);

  if (!dashboard) {
    return <DashboardLoading initPhase={dashboardState.initPhase} />;
  }

  return (
    <Page
      pageNav={{ text: dashboard.title }}
      layout={PageLayoutType.Custom}
      toolbar={<Toolbar dashboard={dashboard} />}
    >
      {dashboardState.initError && <DashboardFailed />}
      <div className={styles.gridContainer}>
        <DashboardGrid dashboard={dashboard} isEditable={false} viewPanel={null} editPanel={null} />
      </div>
      <PublicDashboardFooter />
    </Page>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  gridContainer: css({
    padding: theme.spacing(0, 2, 2, 2),
    overflow: 'auto',
  }),
});

export default PublicDashboardPage;
