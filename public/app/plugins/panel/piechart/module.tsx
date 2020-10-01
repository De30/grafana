import { PanelPlugin } from '@grafana/data';
import { PieChartPanel } from './PieChartPanel';
import { PieChartOptions } from './types';
import { addStandardDataReduceOptions } from '../stat/types';
import { PieChartType } from '@grafana/ui';

export const plugin = new PanelPlugin<PieChartOptions>(PieChartPanel).useFieldConfig().setPanelOptions(builder => {
  addStandardDataReduceOptions(builder, false);

  builder
    .addRadio({
      name: 'Type',
      path: 'pieType',
      settings: {
        options: [
          { value: PieChartType.Pie, label: 'Pie' },
          { value: PieChartType.Donut, label: 'Donut' },
        ],
      },
      defaultValue: PieChartType.Pie,
    })
    .addBooleanSwitch({
      name: 'Show legend',
      path: 'showLegend',
      defaultValue: true,
    });
});
