import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, VariableHide } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Tooltip, useStyles2 } from '@grafana/ui';

import { SceneVariableState } from '../types';

export function VariableLabel({ state }: { state: SceneVariableState }) {
  const styles = useStyles2(getStyles);

  if (state.hide === VariableHide.hideLabel) {
    return null;
  }

  const elementId = `var-${state.key}`;
  const labelOrName = state.label ?? state.name;

  if (state.description) {
    return (
      <Tooltip content={state.description} placement={'bottom'}>
        <label
          className={styles.variableLabel}
          data-testid={selectors.pages.Dashboard.SubMenu.submenuItemLabels(labelOrName)}
          htmlFor={elementId}
        >
          {labelOrName}
        </label>
      </Tooltip>
    );
  }

  return (
    <label
      className={styles.variableLabel}
      data-testid={selectors.pages.Dashboard.SubMenu.submenuItemLabels(labelOrName)}
      htmlFor={elementId}
    >
      {labelOrName}
    </label>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  variableLabel: css({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    height: theme.spacing(theme.components.height.md),
    flexShrink: 0,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
    marginRight: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius(1),
    background: theme.colors.background.primary,
    border: `1px solid ${theme.components.panel.borderColor}`,
  }),
});
