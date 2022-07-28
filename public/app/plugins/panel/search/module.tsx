import { PanelPlugin } from '@grafana/data';

import { SearchPanel } from './SearchPanel';
import { SearchPanelOptions } from './types';

export const plugin = new PanelPlugin<SearchPanelOptions>(SearchPanel).setPanelOptions((builder) => {
  builder
    .addNumberInput({
      path: 'panelHeight',
      name: 'Panel height',
      defaultValue: 5,
    });
});
