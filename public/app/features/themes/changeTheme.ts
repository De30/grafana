import { createTheme } from '@grafana/data';
import { ThemeChangedEvent } from '@grafana/runtime';
import appEvents from 'app/core/app_events';

import { CustomTheme } from './state';

export function setRuntimeTheme(custom: CustomTheme) {
  const runtimeTheme = createTheme(custom.body);
  appEvents.publish(new ThemeChangedEvent(runtimeTheme));
}
