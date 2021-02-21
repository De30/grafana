// Libraries
import { GrafanaTheme } from '@grafana/data';
import { useStyles } from '@grafana/ui';
import { css } from 'emotion';
import React, { FC } from 'react';

// Components
import PageLoader from '../PageLoader/PageLoader';

interface Props {
  isLoading?: boolean;
  children: React.ReactNode;
}

export const PageContents: FC<Props> = ({ isLoading, children }) => {
  const styles = useStyles(getStyles);
  return <div className={styles.pageContainer}>{isLoading ? <PageLoader /> : children}</div>;
};

const getStyles = (theme: GrafanaTheme) => ({
  pageContainer: css``,
});
