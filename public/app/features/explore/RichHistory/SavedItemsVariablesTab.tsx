import { css } from '@emotion/css';
import React, { useState, useEffect } from 'react';

import { GrafanaTheme } from '@grafana/data';
import { stylesFactory, useTheme } from '@grafana/ui';

import { api } from '../variables.api';

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

  const [variablesList, setVariablesList] = useState([]);
  const [totalVariablesCount, setTotalVariablesCount] = useState(undefined);

  useEffect(() => {
    async function fetchVariables() {
      const variables = await api.loadVariables();
      console.log(variables);
      setVariablesList(variables.result.exploreVariables);
      setTotalVariablesCount(variables.result.totalCount);
    }

    fetchVariables();
  }, []);

  return (
    <div className={styles.container}>
      Variables!
      {variablesList.toString()}
      {totalVariablesCount}
    </div>
  );
}
