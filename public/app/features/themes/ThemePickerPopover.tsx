import { css } from '@emotion/css';
import React, { useState } from 'react';
import { useAsync } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, CustomScrollbar, useStyles2 } from '@grafana/ui';
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
        <Button onClick={onClose} icon="times" variant="secondary" />
      </div>
      <div className={styles.body}>
        <CustomScrollbar autoHeightMin={0}>
          {state.themes.map((theme, index) => (
            <div className={styles.card} key={index}>
              {theme.name}
              <div>
                <Button fill="text" onClick={() => onSelectTheme(theme)}>
                  Select
                </Button>
              </div>
            </div>
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
      width: '300px',
      zIndex: theme.zIndex.modal,
      bottom: 8,
      top: '88px',
      right: 8,
      borderRadius: theme.shape.borderRadius(2),
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.medium}`,
      boxShadow: theme.shadows.z3,
      padding: theme.spacing(1),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    header: css({
      display: 'flex',
      justifyContent: 'flex-end',
    }),
    body: css({
      label: 'body',
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      minHeight: 0,
    }),
    card: css({
      display: 'flex',
      background: theme.colors.background.secondary,
      padding: theme.spacing(1),
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
  };
};
