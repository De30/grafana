import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme } from '@grafana/data';
import { stylesFactory, useTheme } from '@grafana/ui';

export interface SavedItemsVariablesTabProps {}

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    container: css`
      font-size: ${theme.typography.size.sm};
    `,
    spaceBetween: css`
      margin-bottom: ${theme.spacing.lg};
    `,
    input: css`
      max-width: 200px;
    `,
  };
});

export function SavedItemsVariablesTab(props: SavedItemsVariablesTabProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return <div className={styles.container}>Variables!</div>;
}
