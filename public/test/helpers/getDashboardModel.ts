import { Dashboard, Panel } from '@grafana/schema';

import { DashboardModel, PanelModel } from '../../app/features/dashboard/state';

export const getDashboardModel = (json: any, meta: any = {}) => {
  const getVariablesFromState = () => json.templating.list;
  return new DashboardModel(json, meta, getVariablesFromState);
};

export const getDashboardModelMock = () => {
  const dashboard: Dashboard = {
    editable: true,
    graphTooltip: 0,
    revision: 1,
    schemaVersion: 0,
    style: 'dark',
  };
  return new DashboardModel(dashboard);
};

// const dashboard = new DashboardMockBuilder().addPanel(panelBuilder.withTransformations([]).withTargets([])).


const isPanelModel = (panel: Partial<Panel>): panel is Panel => {
  return ((typeof panel === 'object') && (typeof panel.id === 'number'|| typeof panel.id === undefined)
  && (typeof panel.type === 'string')); 
}

class PanelMockBuilder {
  private mock: Partial<Panel> = {};
  constructor() {}

  build(): Panel {
    return this.mock;
  }
}
