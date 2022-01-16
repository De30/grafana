import { PanelPlugin } from '@grafana/data';
import { MultiChart } from './MultiChart';
import { MultiChartOptions } from './types';

export const plugin = new PanelPlugin<MultiChartOptions>(MultiChart).useFieldConfig().setPanelOptions((builder) => {});
