import { PanelPlugin } from '@grafana/data';

import { SearchPanel } from './SearchPanel';
import { SearchPanelOptions } from './types';

export const plugin = new PanelPlugin<SearchPanelOptions>(SearchPanel).setPanelOptions((builder) => {
  builder
    .addRadio({
      path: 'message',
      name: 'Show Message',
      description: 'Display the last message received on this channel',
      settings: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      },
      defaultValue: 'a',
    });
});
