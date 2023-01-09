import React from 'react';

import { PageLayoutType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { PageToolbar, ToolbarButton } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { Page } from 'app/core/components/Page/Page';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneComponentProps, SceneObjectStatePlain, SceneObject } from '../core/types';
import { UrlSyncManager } from '../services/UrlSyncManager';

interface SceneState extends SceneObjectStatePlain {
  title: string;
  body: SceneObject;
  actions?: SceneObject[];
  subMenu?: SceneObject;
  isEditing?: boolean;
}

export class Scene extends SceneObjectBase<SceneState> {
  public static Component = SceneRenderer;
  private urlSyncManager?: UrlSyncManager;

  public activate() {
    super.activate();
    this.urlSyncManager = new UrlSyncManager(this);
    this.urlSyncManager.initSync();
  }

  public deactivate() {
    super.deactivate();
    this.urlSyncManager!.cleanUp();
  }
}

export class EmbeddedScene extends Scene {
  public static Component = EmbeddedSceneRenderer;
}

function EmbeddedSceneRenderer({ model }: SceneComponentProps<Scene>) {
  const { body, isEditing, subMenu } = model.useState();
  return (
    <div
      style={{
        flexGrow: 1,
        display: 'flex',
        gap: '8px',
        overflow: 'auto',
        minHeight: '100%',
        flexDirection: 'column',
      }}
    >
      {subMenu && <subMenu.Component model={subMenu} />}
      <div style={{ flexGrow: 1, display: 'flex', gap: '8px', overflow: 'auto' }}>
        <body.Component model={body} isEditing={isEditing} />
      </div>
    </div>
  );
}
function SceneRenderer({ model }: SceneComponentProps<Scene>) {
  const { title, body, actions = [], isEditing, $editor, subMenu } = model.useState();

  const toolbarActions = (actions ?? []).map((action) => <action.Component key={action.state.key} model={action} />);

  if ($editor) {
    toolbarActions.push(
      <ToolbarButton
        key="scene-settings"
        icon="cog"
        variant={isEditing ? 'primary' : 'default'}
        onClick={() => model.setState({ isEditing: !model.state.isEditing })}
      />
    );
  }

  const pageToolbar = config.featureToggles.topnav ? (
    <AppChromeUpdate actions={toolbarActions} />
  ) : (
    <PageToolbar title={title}>{toolbarActions}</PageToolbar>
  );

  return (
    <Page navId="scenes" pageNav={{ text: title }} layout={PageLayoutType.Canvas} toolbar={pageToolbar}>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subMenu && <subMenu.Component model={subMenu} />}
        <div style={{ flexGrow: 1, display: 'flex', gap: '8px', overflow: 'auto' }}>
          <body.Component model={body} isEditing={isEditing} />
          {$editor && <$editor.Component model={$editor} isEditing={isEditing} />}
        </div>
      </div>
    </Page>
  );
}
