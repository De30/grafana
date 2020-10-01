import { PieChartType, SingleStatBaseOptions } from '@grafana/ui';

export interface PieChartOptions extends SingleStatBaseOptions {
  pieType: PieChartType;
  showLegend?: boolean;
}
