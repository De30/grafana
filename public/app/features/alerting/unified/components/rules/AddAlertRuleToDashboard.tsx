import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { css } from '@emotion/css/';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { DashboardPickerByID, DashboardPickerItem } from 'app/core/components/editors/DashboardPickerByID';
import { CombinedRule } from 'app/types/unified-alerting';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { getDashboardModel } from 'app/features/dashboard/state/selectors';
import { importPluginModule } from 'app/features/plugins/plugin_loader';

interface Props {
  rule: CombinedRule;
}

export const AddAlertRuleToDashboard: FC<Props> = ({ rule }) => {
  const [dashboardItem, setDashboardItem] = useState<DashboardPickerItem>();
  const [canCreate, setCanCreate] = useState(false);
  const dispatch = useDispatch();
  const dashboard = useSelector(getDashboardModel);
  const styles = useStyles2(getStyles);
  const alertRulePlugin = importPluginModule('alertRule');

  useEffect(() => {
    if (dashboardItem) {
      dispatch(
        initDashboard({
          urlUid: dashboardItem.uid,
          fixUrl: true,
        })
      );
    }
  }, [dispatch, dashboardItem]);

  useEffect(() => {
    if (dashboard) {
      dashboard.addPanel({
        type: 'add-panel',
        gridPos: { x: 0, y: 0, w: 12, h: 8 },
        title: rule.name,
        plugin: alertRulePlugin,
      });

      setCanCreate(true);
    }
  }, [alertRulePlugin, rule.name, dashboard]);

  return (
    <div>
      <DashboardPickerByID onChange={(value) => setDashboardItem(value)} value={dashboardItem} />
      <LinkButton
        className={styles.create}
        type="button"
        disabled={!canCreate}
        href={`/d/${dashboard}/${dashboard?.title}`}
      >
        Create
      </LinkButton>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  create: css`
    margin-top: ${theme.spacing(2)};
  `,
});
