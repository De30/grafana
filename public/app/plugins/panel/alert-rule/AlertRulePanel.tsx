import { css } from '@emotion/css';
import React, { FC } from 'react';

import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { CustomScrollbar, useStyles2 } from '@grafana/ui';

import { AlertRulePanelOptions } from './types';

interface Props extends PanelProps<AlertRulePanelOptions> {}
export const AlertRulePanel: FC<Props> = ({ options, width, height }) => {
  const styles = useStyles2(getStyles);

  return (
    <CustomScrollbar autoHeightMin="100%" autoHeightMax="100%">
      <div style={{ width, height }}>
        <h4>Rule name</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className={styles.ruleState}>{/*Rule state*/}</div>
        </div>
      </div>
    </CustomScrollbar>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  ruleState: css`
    margin-right: ${theme.spacing(3)};
    height: 24px;
  `,
  button: css`
    height: 24px;
    margin-top: ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
  `,
});
