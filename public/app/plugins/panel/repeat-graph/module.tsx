import { PanelPlugin } from '@grafana/data';
import { RepeatGraphPanel } from './RepeatGraphPanel';
import { Options, defaults } from './types';

export const plugin = new PanelPlugin<Options>(RepeatGraphPanel)
  .useFieldConfig()
  .setPanelOptions(builder => {
    builder.addTextInput({
      path: 'title',
      name: 'Title',
      defaultValue: 'Title',
    });
  })
  .setNoPadding()
  .setDefaults(defaults);
