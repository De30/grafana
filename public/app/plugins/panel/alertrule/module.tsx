import { PanelPlugin } from '@grafana/data';
import { AlertRulePanel } from './AlertRulePanel';
import { AlertRulePanelOptions } from './types';

export const plugin = new PanelPlugin<AlertRulePanelOptions>(AlertRulePanel);
