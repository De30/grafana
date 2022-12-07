import { css } from '@emotion/css';
import React from 'react';

import { Icon, useStyles2 } from '@grafana/ui';

import { GrafanaTheme2 } from '../../../../../packages/grafana-data';

type Props = {
  features: Record<string, { available: boolean; enabled: boolean }>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  table: css`
    border-radius: ${theme.shape.borderRadius()};
    background-color: ${theme.colors.background.primary};
    width: 100%;
    margin-bottom: 10px;

    th,
    td {
      padding: ${theme.spacing(1)};
      border: solid 1px ${theme.colors.border.medium};
    }
  `,
  feature: css`
    text-align: center;
  `,
});

export const FeatureList = (props: Props) => {
  const { features } = props;
  const styles = useStyles2(getStyles);
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>
            <b>Feature</b>
          </th>
          <th className={styles.feature}>
            <b>Available</b>
          </th>
          <th className={styles.feature}>
            <b>Enabled</b>
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(features).map((featureName, index) => {
          return (
            <tr key={index}>
              <td>{featureName}</td>
              <td className={styles.feature}>
                <Icon name={features[featureName].available ? 'check' : 'minus'} />
              </td>
              <td className={styles.feature}>
                <Icon name={features[featureName].enabled ? 'check' : 'minus'} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
