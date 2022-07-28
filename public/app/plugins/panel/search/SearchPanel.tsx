import { css } from '@emotion/css';
import { debounce } from 'lodash';
import React, { PureComponent } from 'react';
import { Unsubscribable } from 'rxjs';

import {
  GrafanaTheme,
  PanelProps,
  LiveChannelConnectionState,
  PanelModel,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { Input, PanelContext, PanelContextRoot, stylesFactory } from '@grafana/ui';
import { backendSrv } from 'app/core/services/backend_srv';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { DashboardModel } from 'app/features/dashboard/state';
import { GridPos } from 'app/features/dashboard/state/PanelModel';
import { DashboardQueryResult, getGrafanaSearcher } from 'app/features/search/service';

import { TextMode } from '../text/models.gen';

import { SearchPanelOptions } from './types';

interface Props extends PanelProps<SearchPanelOptions> { }

interface State {
  query: string;
  dashboards: React.ReactNode[];
}

export class SearchPanel extends PureComponent<Props, State> {
  static contextType = PanelContextRoot;
  panelContext: PanelContext = {} as PanelContext;

  subscription?: Unsubscribable;
  styles = getStyles(config.theme);
  dashboard: DashboardModel | undefined;
  dashbaords = new Map<string, DashboardModel>();

  constructor(props: Props) {
    super(props);
    this.dashboard = getDashboardSrv().getCurrent();
    this.state = { query: '', dashboards: [] };
  }

  componentDidMount() {
    this.panelContext = this.context as PanelContext;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { query } = this.state;
    if (query !== prevState.query) {
      if (this.panelContext.app === 'dashboard') {
        this.doQuery();
      } else {
        console.log("skip in editor");
      }
    }
  }

  counter = 100;

  private async findPanel(row: DashboardQueryResult, gridPos: GridPos): Promise<PanelModel> {
    const idx = row.uid.indexOf('#');
    if(idx<2) {
      return this.getErrorPanel("expected # in the UID", row, gridPos);
    }

    const dashuid = row.uid.substring(0, idx);
    const panelid = parseInt(row.uid.substring(idx+1), 10);
    const dash = await backendSrv.getDashboardByUid(dashuid);
    const found = dash.dashboard?.panels?.find(p => p.id === panelid);
    if (!found) {
      return this.getErrorPanel("Unable to find: "+row.uid, row, gridPos);
    }
    // none of this is working :(
    dash.meta.canEdit = false; // avoids popup
    dash.meta.canSave = false; // avoids popup
    dash.meta.fromScript = true; // avoids popup

    const links = [
      {
        title: "Dashboard",
        url: row.uid,
      }
    ];
    if (found.links && Array.isArray(found.links)) {
      for(const v of found.links) {
        links.push(v);
      }
    }

    return {
      ...found,
      id: this.counter++,
      key: row.uid,
      gridPos,
      links,
    };
  }

  getErrorPanel(err: string, row: DashboardQueryResult, gridPos: GridPos): PanelModel {
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
      gridPos,
    };
    return v;
  }

  doQuery = debounce(async () => {
    const { query } = this.state;
    const { dashboard } = this;
    if (!dashboard) {
      return;
    }
    const self = dashboard.getPanelById(this.props.id);
    if (!self) {
      return;
    }

    const searcher = getGrafanaSearcher();
    const panelResults = await searcher.search({
      query,
      kind: ["panel"],
      limit: 12,
    });

    let panelW = 24/4; //8
    let startX = 0;
    const gridPos = self.gridPos;
    gridPos.x = 0;
    gridPos.y = 0;
    const vertical = gridPos.h>gridPos.w;
    if(vertical) {
      startX = gridPos.w;

      const space = 24-gridPos.w;
      panelW = Math.floor(space/3);
      if(panelW < 6) {
        panelW = Math.floor(space/2);
      }

      // Fill dashboards
      searcher.search({
        query,
        kind: ["dashboard"],
        limit: 15,
      }).then(results => {
        this.setState({
          dashboards: results.view.map(item => <div key={item.uid}><a href={item.url}>{item.name}</a></div>),
        });
      });
    } else {
      this.setState({dashboards:[]});
    }


    let x = startX;
    const h = this.props.options.panelHeight ?? 4;
    const panels: PanelModel[] = [self];
    for (let i = 0; i < panelResults.view.length; i++) {
      const row = panelResults.view.get(i);
      if (x > 20) {
        x = startX;
      }

      const p = await this.findPanel(row, {
        y: 0, // should increase?
        x: x,
        w: panelW,
        h,
      });
      panels.push(p);
      x += panelW;
    }
    dashboard.updatePanels(panels);
  }, 200);


  render() {
    const { query, dashboards } = this.state;
    return (
      <div>
        <Input value={query} onChange={(v) => this.setState({ query: v.currentTarget.value })} />

        {Boolean(dashboards.length) && <div>
          <br/>
          <h2>Dashboards</h2>
          {dashboards}
        </div>}

        {this.panelContext.app !== 'dashboard' && <div>
          <h2>EDITOR!</h2>
          <ul>
            <li>APP: {this.panelContext.app}</li>
            <li>Dashboard: {this.dashboard?.title}</li>
            <li>Search: {query}</li>
          </ul>
        </div>}
      </div>
    );
  }
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  statusWrap: css`
    margin: auto;
    position: absolute;
    top: 0;
    right: 0;
    background: ${theme.colors.panelBg};
    padding: 10px;
    z-index: ${theme.zIndex.modal};
  `,
  status: {
    [LiveChannelConnectionState.Pending]: css`
      border: 1px solid ${theme.palette.brandPrimary};
    `,
    [LiveChannelConnectionState.Connected]: css`
      border: 1px solid ${theme.palette.brandSuccess};
    `,
    [LiveChannelConnectionState.Disconnected]: css`
      border: 1px solid ${theme.palette.brandWarning};
    `,
    [LiveChannelConnectionState.Shutdown]: css`
      border: 1px solid ${theme.palette.brandDanger};
    `,
    [LiveChannelConnectionState.Invalid]: css`
      border: 1px solid red;
    `,
  },
}));
