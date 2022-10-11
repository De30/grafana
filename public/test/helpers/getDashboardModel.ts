import { Dashboard, Panel, Transformation } from '@grafana/schema';

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

function isPanel(panel: Partial<Panel>): panel is Panel {
  return (
    (typeof panel.id === 'number' || typeof panel.id === undefined) &&
    typeof panel.type === 'string' &&
    typeof panel.transparent === 'boolean' &&
    Array.isArray(panel.transformations) &&
    Boolean(panel.repeatDirection && ['h', 'v'].includes(panel.repeatDirection)) &&
    Boolean(panel.options && Object.keys(panel.options).every((v) => typeof v === 'string')) &&
    Boolean(
      panel.fieldConfig && typeof panel.fieldConfig.defaults === 'object' && Array.isArray(panel.fieldConfig.overrides)
    )
  );
}

class PanelMockBuilder {
  private mock: Partial<Panel> = { transparent: false };
  constructor() {}

  build(): Panel {
    if (isPanel(this.mock)) {
      return this.mock;
    } else {
      throw new Error('this.mock is not a Panel!');
    }
  }

  setType(type: string) {
    this.mock.type = type;
    return this;
  }

  setTransparent() {
    this.mock.transparent = true;
    return this;
  }

  addTransformation(...transformations: Transformation[]) {
    this.mock.transformations = (this.mock.transformations ?? []).concat(...transformations);
    return this;
  }
}
