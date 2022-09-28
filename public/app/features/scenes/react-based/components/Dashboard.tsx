import React, { Children, useEffect } from 'react';

import { PageLayoutType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { PageToolbar, ToolbarButton } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { Page } from 'app/core/components/Page/Page';

import { UrlSyncManager } from '../services/UrlSyncManager';

interface DashboardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  // This probably shouldn't be part of a non-nested dashboard
  canCollapse?: boolean;
}

export function Dashboard(props: DashboardProps) {
  // See how do we do sync state with URL

  const { title, actions = [], children } = props;

  const toolbarActions = (actions ?? []).map((action) => <action.Component key={action.id} {...action.props} />);

  const pageToolbar = config.featureToggles.topnav ? (
    <AppChromeUpdate actions={toolbarActions} />
  ) : (
    <PageToolbar title={title}>{toolbarActions}</PageToolbar>
  );

  // Remove page, the dashboard should be a single component
  return (
    <Page navId="scenes" pageNav={{ text: title }} layout={PageLayoutType.Canvas} toolbar={pageToolbar}>
      {children}
    </Page>
  );
}
