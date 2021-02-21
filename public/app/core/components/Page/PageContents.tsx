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
  pageContainer: css`
    flex-grow: 1;
    flex-basis: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: ${theme.spacing.md};
    max-width: 980px;
    background: ${theme.colors.bg1};
    border: 1px solid ${theme.colors.border1};
    border-radius: ${theme.border.radius.sm};
  `,
});
