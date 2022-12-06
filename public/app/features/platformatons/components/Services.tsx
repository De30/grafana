import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data/src';
import { useStyles2 } from '@grafana/ui/src';

import ServicesSearchTable from './ServicesSearchTable';

export const Services = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.tableWrapper}>
      <ServicesSearchTable />
    </div>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    tableWrapper: css`
      height: 100%;
    `,
  };
};
