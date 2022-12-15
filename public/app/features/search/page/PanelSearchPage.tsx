// Libraries
import React, { useMemo, useRef, useState } from 'react';
import { useAsync } from 'react-use';

import { config } from '@grafana/runtime';
import { Input } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { backendSrv } from 'app/core/services/backend_srv';
import { PanelModel } from 'app/features/dashboard/state';
import { Scene, SceneGridLayout, VizPanel } from 'app/features/scenes/components';
import { SceneTimeRange } from 'app/features/scenes/core/SceneTimeRange';
import { SceneQueryRunner } from 'app/features/scenes/querying/SceneQueryRunner';
import { getQueryRunnerWithRandomWalkQuery } from 'app/features/scenes/scenes/queries';
import { TextMode } from 'app/plugins/panel/text/models.gen';

import { DashboardQueryResult, getGrafanaSearcher } from '../service';

export interface Props extends GrafanaRouteComponentProps<{ name: string }> {}

export default function PanelSearchPage(props: Props) {
  const searcher = useRef(new PanelModelSearcher());
  const [query, setQuery] = useState<string>();

  const results = useAsync(() => {
    return searcher.current.search(query ?? '*');
  }, [query]);

  const scene = useMemo(() => {
    return results.value ? panelsToScene(results.value) : undefined;
  }, [results.value]);

  return (
    <Page navId="scenes" subTitle="Search for panels">
      <Page.Contents>
        <Input value={query} onChange={(v) => setQuery(v.currentTarget.value)} loading={results.loading} />

        {scene && <scene.Component model={scene} />}
      </Page.Contents>
    </Page>
  );
}

class PanelModelSearcher {
  private counter = 0;

  async search(query: string): Promise<PanelModel[]> {
    const searcher = getGrafanaSearcher();
    const panelResults = await searcher.search({
      query,
      kind: ['panel'],
      limit: 12,
    });

    const panels: PanelModel[] = [];
    for (let i = 0; i < panelResults.view.length; i++) {
      const row = panelResults.view.get(i);
      if (row.panel_type === 'row') {
        continue;
      }
      const p = await this.findPanel(row);
      if (p.type === 'row') {
        console.log('WHY?', row, p);
        continue;
      }
      panels.push(p);
    }
    return panels;
  }

  async findPanel(row: DashboardQueryResult): Promise<PanelModel> {
    if (!config.panels[row.panel_type]) {
      return this.getErrorPanel('Unknown panel type ' + row.panel_type, row);
    }

    const idx = row.uid.indexOf('#');
    if (idx < 2) {
      return this.getErrorPanel('expected # in the UID', row);
    }

    const dashuid = row.uid.substring(0, idx);
    const panelid = parseInt(row.uid.substring(idx + 1), 10);
    const dash = await backendSrv.getDashboardByUid(dashuid); // TODO cache
    const found = dash.dashboard?.panels?.find((p) => p.id === panelid);
    if (!found) {
      return this.getErrorPanel('Unable to find: ' + row.uid, row);
    }
    // none of this is working :(
    dash.meta.canEdit = false; // avoids popup
    dash.meta.canSave = false; // avoids popup
    dash.meta.fromScript = true; // avoids popup

    const links = [
      {
        title: 'Dashboard',
        url: row.uid,
      },
    ];
    if (found.links && Array.isArray(found.links)) {
      for (const v of found.links) {
        links.push(v);
      }
    }

    return {
      ...found,
      id: this.counter++,
      key: row.uid,
      links,
    };
  }

  getErrorPanel(err: string, row: DashboardQueryResult): PanelModel {
    const v = {
      id: this.counter++,
      key: row.uid,
      title: `ERROR: ${row.name}`,
      type: 'text',
      options: {
        content: `ERROR:  ${err}`,
        mode: TextMode.Markdown,
      },
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    return v as unknown as PanelModel;
  }
}

export function panelsToScene(results: PanelModel[]): Scene {
  let x = 0;
  let height = 4; // grid
  let panelW = 24 / 3; //8
  let startX = 0;

  const state = {
    title: 'Grid with row layout test',
    layout: new SceneGridLayout({
      children: results.map((panel, idx) => {
        if (x > 20) {
          x = startX;
        }
        const p = new VizPanel({
          isResizable: false,
          isDraggable: false,
          size: { x, y: 0, width: panelW, height },

          // Standard fields
          title: panel.title,
          pluginId: panel.type,
          options: panel.options,
          fieldConfig: panel.fieldConfig,
          pluginVersion: panel.pluginVersion,
          $data: new SceneQueryRunner({
            queries: panel.targets,
          }),
        });
        x += panelW;
        return p;
      }),
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
  };

  return new Scene(state);
}
