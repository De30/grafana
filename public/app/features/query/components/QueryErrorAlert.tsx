import { css, cx } from '@emotion/css';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import React, { useState } from 'react';

import { DataQueryError, GrafanaTheme2, renderMarkdown } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';

export interface Props {
  error: DataQueryError;
}

export function QueryErrorAlert({ error }: Props) {
  const styles = useStyles2(getStyles);
  const [state, setState] = useState({ expanded: false });

  const message = error?.message ?? error?.data?.message ?? 'Query error';

  if (error.errata !== undefined) {
    const err = error.errata;
    const markdownContent = renderMarkdown(err.guide, { breaks: true });
    const expanded = state.expanded;
    return (
      <div className={styles.wrapper}>
        <div className={styles.icon}>
          <Icon name="exclamation-triangle" />
        </div>
        <div className={styles.errataBox}>
          <h3>{err.message}</h3>
          <div className={cx(styles.markdownContent, expanded ? styles.expanded : undefined)}>
            <span>
              <DangerouslySetHtmlContent html={markdownContent}></DangerouslySetHtmlContent>
            </span>
            {!expanded && <span className={styles.fader}></span>}
          </div>
          <Button
            variant="secondary"
            onClick={(e) => {
              setState({ expanded: !expanded });
            }}
          >
            {expanded ? 'Read less' : 'Read more'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <Icon name="exclamation-triangle" />
      </div>
      <div className={styles.message}>{message}</div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    marginTop: theme.spacing(0.5),
    background: theme.colors.background.secondary,
    display: 'flex',
  }),
  icon: css({
    background: theme.colors.error.main,
    color: theme.colors.error.contrastText,
    padding: theme.spacing(1),
  }),
  message: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    padding: theme.spacing(1),
  }),
  errataBox: css({
    padding: theme.spacing(1),
  }),
  markdownContent: css({
    maxHeight: '50px',
    overflow: 'hidden',
    position: 'relative',

    '& h2': {
      fontSize: theme.typography.h4.fontSize,
    },
    '& h3': {
      fontSize: theme.typography.h5.fontSize,
    },
  }),
  expanded: css({
    maxHeight: 'inherit',
  }),
  fader: css({
    position: 'absolute',
    height: '60px',
    width: '100%',
    bottom: 0,
    backgroundImage: 'linear-gradient(to bottom, transparent, ' + theme.colors.background.secondary + ')',
  }),
});
