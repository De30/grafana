import { css } from '@emotion/css/';
import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAsync } from 'react-use';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Button, useStyles2 } from '@grafana/ui';
import { DashboardPicker } from 'app/core/components/Select/DashboardPicker';
import { contextSrv } from 'app/core/services/context_srv';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { AccessControlAction, DashboardDTO } from 'app/types';

import { dashboardLoaderSrv } from '../../../../dashboard/services/DashboardLoaderSrv';
import { DashboardModel } from '../../../../dashboard/state';
import { getPanelPluginWithFallback } from '../../../../dashboard/state/selectors';

interface Props {
  ruleName: string;
}

enum SaveTarget {
  NewDashboard = 'new-dashboard',
  ExistingDashboard = 'existing-dashboard',
}

export const AddAlertRuleToDashboard: FC<Props> = ({ ruleName }) => {
  const [dashboardItem, setDashboardItem] = useState<string>();
  const [dashboard, setDashboard] = useState<DashboardModel>();
  const [dashboardType, setDashboardType] = useState<SaveTarget>();
  const [canCreate, setCanCreate] = useState(false);
  const dispatch = useDispatch();
  const plugin = useSelector(getPanelPluginWithFallback('alertrule'));
  const styles = useStyles2(getStyles);

  //
  // useEffect(() => {
  //   if (dashboardDto) {
  //     setDashboard(new DashboardModel(dashboardDto.dashboard, dashboardDto.meta));
  //     setCanCreate(true);
  //   }
  //
  //   if (dashboard) {
  //     dashboard.addPanel({
  //       gridPos: { x: 0, y: 0, w: 12, h: 8 },
  //       title: ruleName,
  //       plugin: plugin,
  //     });
  //
  //     console.log('new panel on dashboard', dashboard.panels);
  //
  //     setDashboard(dashboard);
  //   }
  // }, [dispatch, dashboardItem, plugin, ruleName, dashboard, dashboardDto]);

  const canCreateDashboard = contextSrv.hasAccess(AccessControlAction.DashboardsCreate, contextSrv.isEditor);
  const canWriteDashboard = contextSrv.hasAccess(AccessControlAction.DashboardsWrite, contextSrv.isEditor);

  const saveTargets: Array<SelectableValue<SaveTarget>> = [];
  if (canCreateDashboard) {
    saveTargets.push({
      label: 'New dashboard',
      value: SaveTarget.NewDashboard,
    });
  }
  if (canWriteDashboard) {
    saveTargets.push({
      label: 'Existing dashboard',
      value: SaveTarget.ExistingDashboard,
    });
  }

  const createPanel = async () => {
    if (dashboard) {
      const saved = await getDashboardSrv().saveDashboard({ dashboard });
      if (saved) {
        // locationService.replace(`/d/${dashboard.uid}/${dashboard.title}`);
      }
    }
  };

  return (
    <div>
      {dashboardType === SaveTarget.ExistingDashboard && <DashboardPicker onChange={(d) => setDashboardItem(d?.uid)} />}
      {dashboardType === SaveTarget.NewDashboard && <span>Create new dashboard</span>}
      <Button className={styles.create} type="button" disabled={!canCreate} onClick={createPanel}>
        Create
      </Button>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  create: css`
    margin-top: ${theme.spacing(2)};
  `,
});
