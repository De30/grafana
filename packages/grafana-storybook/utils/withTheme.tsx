import React from 'react';
import { getTheme, ThemeContext } from '@grafana/ui';
import { GrafanaThemeType } from '@grafana/data';
import { RenderFunction } from '../types/storybook';
import { useDarkMode } from 'storybook-dark-mode';

type SassThemeChangeHandler = (theme: GrafanaThemeType) => void;
const ThemeableStory: React.FunctionComponent<{ handleSassThemeChange: SassThemeChangeHandler }> = ({
  children,
  handleSassThemeChange,
}) => {
  const theme = useDarkMode() ? GrafanaThemeType.Dark : GrafanaThemeType.Light;

  handleSassThemeChange(theme);

  return <ThemeContext.Provider value={getTheme(theme)}>{children}</ThemeContext.Provider>;
};

export const withTheme = (handleSassThemeChange: SassThemeChangeHandler) => (story: RenderFunction) => (
  <ThemeableStory handleSassThemeChange={handleSassThemeChange}>{story()}</ThemeableStory>
);
