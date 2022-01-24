import { GraphFieldConfig } from '@grafana/schema';
import { PanelPlugin } from '@grafana/data';
import { HeatmapPanel } from './VideoPanel';
import { PanelOptions, defaultPanelOptions, defaultPanelFieldConfig } from './models.gen';
import { getVideoFieldConfig } from './config';

export const plugin = new PanelPlugin<PanelOptions, GraphFieldConfig>(HeatmapPanel)
  .useFieldConfig(getVideoFieldConfig(defaultPanelFieldConfig))
  .setPanelOptions((builder, context) => {
    const opts = context.options ?? defaultPanelOptions;
    // TODO
    console.log('OPTS', opts);
  });
