import { StoreState } from 'app/types';
import { PanelPlugin } from '@grafana/data';
import { getPanelPluginNotFound } from '../../panel/components/PanelPluginError';
import { DashboardModel } from './DashboardModel';

export const getPanelPluginWithFallback =
  (panelType: string) =>
  (state: StoreState): PanelPlugin => {
    const plugin = state.plugins.panels[panelType];
    return plugin || getPanelPluginNotFound(`Panel plugin not found (${panelType})`, true);
  };

export const getDashboardModel = (state: StoreState): DashboardModel | null => {
  return state.dashboard.getModel();
};
