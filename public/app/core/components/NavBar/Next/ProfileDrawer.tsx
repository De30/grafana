import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Drawer, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { DashList } from 'app/plugins/panel/dashlist/DashList';
import { PanelOptions } from 'app/plugins/panel/dashlist/models.gen';

export interface Props {
  onClose: () => void;
}

export function ProfileDrawer({ onClose }: Props) {
  const styles = useStyles2(getStyles);
  const dashListOptions: PanelOptions = {
    showHeadings: false,
    showSearch: false,
    showRecentlyViewed: true,
    showStarred: false,
    maxItems: 40,
    query: '',
    tags: [],
  };

  return (
    <Drawer onClose={onClose} width={500} className={styles.drawer}>
      <div className={styles.container}>
        <img className={styles.logo} src={contextSrv.user.gravatarUrl} />
        <div className={styles.name}>{contextSrv.user.name}</div>
        <div className={styles.details}>{contextSrv.user.email}</div>
        <div className={styles.details}>
          <Stack>
            <span>{contextSrv.user.orgName}</span>
            <span>{contextSrv.user.orgRole}</span>
          </Stack>
        </div>
        <TabsBar>
          <Tab icon="sync" label="Recent" active />
          <Tab icon="sliders-v-alt" label="Preferences" />
          <Tab icon="lock" label="Password" />
        </TabsBar>
        <div className={styles.tabContent}>
          <DashList
            id={0}
            data={null as any}
            timeRange={null as any}
            timeZone={'utc'}
            options={dashListOptions}
            transparent={false}
            width={0}
            height={0}
            fieldConfig={null as any}
            renderCounter={0}
            title={''}
            eventBus={null as any}
            onOptionsChange={null as any}
            replaceVariables={null as any}
            onChangeTimeRange={null as any}
            onFieldConfigChange={null as any}
          />
        </div>
      </div>
    </Drawer>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  drawer: css({
    top: 81,
    '.drawer-content-wrapper': {
      boxShadow: 'none !important',
    },
  }),
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    color: theme.colors.text.secondary,
    paddingTop: theme.spacing(2),
    alignItems: 'center',
  }),
  logo: css({
    width: 100,
    height: 100,
    borderRadius: '50%',
  }),
  name: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.h3.fontSize,
    marginBottom: theme.spacing(-2),
  }),
  details: css({}),
  tabContent: css({
    width: '100%',
  }),
});
