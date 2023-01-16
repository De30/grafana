import React from 'react';

import { PageLayoutType } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import {
  UrlSyncManager,
  SceneObjectBase,
  SceneComponentProps,
  SceneLayout,
  SceneObject,
  SceneObjectStatePlain,
} from '@grafana/scenes';
import { PageToolbar, ToolbarButton } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { Page } from 'app/core/components/Page/Page';

interface DashboardSceneState extends SceneObjectStatePlain {
  title: string;
  uid?: string;
  body: SceneLayout;
  actions?: SceneObject[];
  subMenu?: SceneObject;
}

export class DashboardScene extends SceneObjectBase<DashboardSceneState> {
  public static Component = DashboardSceneRenderer;
  private urlSyncManager?: UrlSyncManager;

  public activate() {
    super.activate();
  }

  /**
   * It's better to do this before activate / mount to not trigger unnessary re-renders
   */
  public initUrlSync() {
    this.urlSyncManager = new UrlSyncManager(this);
    this.urlSyncManager.initSync();
  }

  public deactivate() {
    super.deactivate();

    if (this.urlSyncManager) {
      this.urlSyncManager!.cleanUp();
    }
  }
}

function DashboardSceneRenderer({ model }: SceneComponentProps<DashboardScene>) {
  const { title, body, actions = [], uid, subMenu } = model.useState();

  const toolbarActions = (actions ?? []).map((action) => <action.Component key={action.state.key} model={action} />);

  toolbarActions.push(
    <ToolbarButton icon="apps" onClick={() => locationService.push(`/d/${uid}`)} tooltip="View as Dashboard" />
  );
  const pageToolbar = config.featureToggles.topnav ? (
    <AppChromeUpdate actions={toolbarActions} />
  ) : (
    <PageToolbar title={title}>{toolbarActions}</PageToolbar>
  );

  return (
    <Page navId="scenes" pageNav={{ text: title }} layout={PageLayoutType.Canvas} toolbar={pageToolbar}>
      {subMenu && <subMenu.Component model={subMenu} />}
      <div style={{ flexGrow: 1, display: 'flex', gap: '8px', overflow: 'auto' }}>
        <body.Component model={body} />
      </div>
    </Page>
  );
}
