import { createTheme } from '@grafana/data';
import { config, ThemeChangedEvent } from '@grafana/runtime';
import appEvents from 'app/core/app_events';

import { CustomTheme } from './state';

export function setRuntimeTheme(custom: CustomTheme) {
  const options = {
    ...custom.body,
    flags: {
      topnav: config.featureToggles.topnav,
    },
  };

  const runtimeTheme = createTheme(options);
  appEvents.publish(new ThemeChangedEvent(runtimeTheme));
}
