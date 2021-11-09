import React, { ReactNode, useCallback, useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2 } from '../../themes';
import { GrafanaTheme2 } from '@grafana/data';
import { getFocusStyles } from '../../themes/mixins';
import { Icon } from '../Icon/Icon';

export interface Props {
  label: string;
  isOpen: boolean;
  children: ReactNode;
}

export const CollapsableSection = ({ label, isOpen, children }: Props) => {
  const styles = useStyles2(collapsableSectionStyles);
  const [open, setOpen] = useState(isOpen);
  const tooltip = `Click to ${open ? 'collapse' : 'expand'}`;
  const toggleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setOpen((o) => !o);
  }, []);

  return (
    <details className={styles.details} open={open}>
      <summary className={styles.summary} onClick={toggleOpen} title={tooltip}>
        {/** Extra div needed here as safari doesn't support flex on summary tags */}
        <div className={styles.summaryContents}>
          {label}
          <Icon name={open ? 'angle-down' : 'angle-right'} size="xl" className={styles.icon} />
        </div>
      </summary>
      <div className={styles.content}>{children}</div>
    </details>
  );
};

const collapsableSectionStyles = (theme: GrafanaTheme2) => {
  const focusStyle = getFocusStyles(theme);

  const details = css({
    '&:not([open])': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
  });
  const summary = css({
    '&:focus-visible': focusStyle,
    padding: `${theme.spacing(0.5)} 0`,
    fontSize: theme.typography.size.lg,
    cursor: 'pointer',
    // Needed so safari doesn't show the default disclosure arrow
    '&::-webkit-details-marker': {
      display: 'none',
    },
  });
  const summaryContents = css({
    display: 'flex',
    justifyContent: 'space-between',
  });
  const icon = css({
    color: theme.colors.text.secondary,
  });
  const content = css({
    padding: `${theme.spacing(2)} 0`,
  });

  return { details, summary, summaryContents, icon, content };
};
