import { createTheme } from '@grafana/data';
import { config, ThemeChangedEvent } from '@grafana/runtime';
import appEvents from 'app/core/app_events';

import { CustomThemeDTO } from './state';

export function setRuntimeTheme(custom: CustomThemeDTO, safeMode?: boolean) {
  const options = {
    ...custom.body,
    flags: {
      topnav: config.featureToggles.topnav,
    },
  };

  try {
    const runtimeTheme = createTheme(options);
    if (!safeMode) {
      appEvents.publish(new ThemeChangedEvent(runtimeTheme));
    }
    return runtimeTheme;
  } catch (err: unknown) {
    console.error(err);
    return config.theme2;
  }
}
