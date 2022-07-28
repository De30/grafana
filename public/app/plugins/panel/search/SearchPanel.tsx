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
    this.state = { query: '' };
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

    return {
      ...found,
      id: this.counter++,
      key: row.uid,
      gridPos,
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

    const results = await getGrafanaSearcher().search({
      query,
      kind: ["panel"],
      limit: 12,
    });


    const w = 8;
    let x = 0;
    const panels: PanelModel[] = [self];
    for (let i = 0; i < results.view.length; i++) {
      const row = results.view.get(i);
      if (x > 20) {
        x = 0;
      }

      const p = await this.findPanel(row, {
        "y": 0,
        "x": x,
        "w": w,
        "h": 4
      });
      panels.push(p);
      x += w;
    }
    dashboard.updatePanels(panels);
  }, 200);


  render() {
    const { query } = this.state;
    return (
      <div>
        <Input value={query} onChange={(v) => this.setState({ query: v.currentTarget.value })} />

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
