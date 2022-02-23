import { GraphFieldConfig } from '@grafana/schema';
import { PanelPlugin } from '@grafana/data';
import { PanelOptions, defaultPanelOptions, defaultPanelFieldConfig } from './models.gen';
import { getVideoFieldConfig } from './config';
import { VideoPanel } from './VideoPanel';

export const plugin = new PanelPlugin<PanelOptions, GraphFieldConfig>(VideoPanel)
  .useFieldConfig(getVideoFieldConfig(defaultPanelFieldConfig))
  .setPanelOptions((builder, context) => {
    const opts = context.options ?? defaultPanelOptions;
    // TODO
    console.log('OPTS', opts);
  });
