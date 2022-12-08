import { createTheme, GrafanaTheme2 } from '@grafana/data';
import { config, ThemeChangedEvent } from '@grafana/runtime';
import appEvents from 'app/core/app_events';

import { getDashboardSrv } from '../dashboard/services/DashboardSrv';

import { CustomThemeDTO } from './state';

export function setRuntimeTheme(custom: CustomThemeDTO, safeMode?: boolean) {
  const options = {
    ...custom.body,
    flags: {
      topnav: config.featureToggles.topnav,
    },
  };

  try {
    const currentTheme = config.theme2;
    const runtimeTheme = createTheme(options);
    if (!safeMode) {
      appEvents.publish(new ThemeChangedEvent(runtimeTheme));
    }

    if (areVizColorsDifferent(currentTheme, runtimeTheme)) {
      console.log('colors are dif');
      setTimeout(() => {
        getDashboardSrv().getCurrent()?.refresh();
      }, 100);
    }

    return runtimeTheme;
  } catch (err: unknown) {
    console.error(err);
    return config.theme2;
  }
}

function areVizColorsDifferent(theme: GrafanaTheme2, newTheme: GrafanaTheme2) {
  for (const [hueIndex, hue] of theme.visualization.hues.entries()) {
    for (const [colorIndex, color] of hue.shades.entries()) {
      if (color !== newTheme.visualization.hues[hueIndex].shades[colorIndex]) {
        return true;
      }
    }
  }

  return false;
}
