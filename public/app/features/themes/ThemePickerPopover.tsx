import { css } from '@emotion/css';
import React, { useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, CustomScrollbar, Tooltip, useStyles2 } from '@grafana/ui';
import appEvents from 'app/core/app_events';
import { RemoveGlobalComponentEvent } from 'app/types/events';

import { setRuntimeTheme } from './changeTheme';
import { loadAllThemes, CustomThemeDTO } from './state';

interface State {
  themes: CustomThemeDTO[];
}

export function ThemePickerPopover(props: { id: string }) {
  const styles = useStyles2(getStyles);
  const [state, setState] = useState<State>({ themes: [] });

  useAsync(async () => {
    const result = await loadAllThemes();
    setState({ themes: result });
  }, []);

  const onClose = () => {
    appEvents.publish(new RemoveGlobalComponentEvent({ id: props.id }));
  };

  const onSelectTheme = (theme: CustomThemeDTO) => {
    setRuntimeTheme(theme);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="text-center flex-grow-1">Themes</div>
        <Button onClick={onClose} icon="times" variant="secondary" size="sm" />
      </div>
      <div className={styles.body}>
        <CustomScrollbar autoHeightMin={0}>
          {state.themes.map((theme, index) => (
            <Tooltip content="Click to select" key={index}>
              <button className={styles.card} onClick={() => onSelectTheme(theme)}>
                <Stack direction="column" gap={0.25}>
                  {theme.name}
                  <span className="muted small">{theme.description}</span>
                </Stack>
              </button>
            </Tooltip>
          ))}
        </CustomScrollbar>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      position: 'fixed',
      width: '320px',
      zIndex: theme.zIndex.modal,
      bottom: 0,
      top: '88px',
      right: 0,
      borderRadius: theme.shape.borderRadius(2),
      background: theme.colors.background.primary,
      borderLeft: `1px solid ${theme.colors.border.weak}`,
      boxShadow: theme.shadows.z3,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    header: css({
      display: 'flex',
      justifyContent: 'space-between',
      background: theme.colors.background.secondary,
      padding: theme.spacing(1),
      fontWeight: theme.typography.fontWeightMedium,
    }),
    body: css({
      label: 'body',
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      minHeight: 0,
      padding: theme.spacing(1),
    }),
    card: css({
      border: 'none',
      boxShadow: 'none',
      margin: 0,
      display: 'flex',
      background: 'transparent',
      textAlign: 'left',
      //background: theme.colors.background.secondary,
      padding: theme.spacing(1),
      //justifyContent: 'space-between',
      alignItems: 'center',
      //marginBottom: theme.spacing(1),
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      //borderRadius: theme.shape.borderRadius(1),
      ['&:hover']: {
        background: theme.colors.emphasize(theme.colors.background.primary, 0.03),
      },
    }),
  };
};
