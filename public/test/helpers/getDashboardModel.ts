import { Dashboard } from '@grafana/schema';

import { DashboardModel } from '../../app/features/dashboard/state';

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
