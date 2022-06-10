import { css } from '@emotion/css/';
import React, { FC, useAsync, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { GrafanaTheme2 } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Button, useStyles2 } from '@grafana/ui';
import { DashboardPickerByID, DashboardPickerItem } from 'app/core/components/editors/DashboardPickerByID';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { DashboardDTO } from 'app/types';

import { dashboardLoaderSrv } from '../../../../dashboard/services/DashboardLoaderSrv';
import { DashboardModel } from '../../../../dashboard/state';
import { getPanelPluginWithFallback } from '../../../../dashboard/state/selectors';

interface Props {
  ruleName: string;
}

export const AddAlertRuleToDashboard: FC<Props> = ({ ruleName }) => {
  const [dashboardItem, setDashboardItem] = useState<DashboardPickerItem>();
  const [dashboard, setDashboard] = useState<DashboardModel>();
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
      <DashboardPickerByID onChange={(value) => setDashboardItem(value)} value={dashboardItem} />
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
