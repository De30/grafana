import { css, cx } from '@emotion/css';
import DangerouslySetHtmlContent from 'dangerously-set-html-content';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { Errata, GrafanaTheme2, renderMarkdown } from '@grafana/data';
import { Button, clearButtonStyles, Icon, useStyles2, useTheme2 } from '@grafana/ui';

export interface ErrataProps {
  errata: Errata;
  shrink?: boolean;
}

export function ErrataBox({ errata, shrink = false }: ErrataProps) {
  const [state, setState] = useState({ expanded: false, exceedsHeightLimit: false });
  const errorContentRef = useRef<HTMLSpanElement>(null);
  const markdownContent = renderMarkdown(errata.guide, { breaks: true });
  const theme = useTheme2();
  const { expanded, exceedsHeightLimit } = state;
  const styles = useStyles2(getErrataStyles);
  useLayoutEffect(() => {
    if (errorContentRef.current && errorContentRef.current.getBoundingClientRect().height > 50) {
      if (!state.exceedsHeightLimit) {
        setState({ ...state, exceedsHeightLimit: true });
      }
    } else {
      if (state.exceedsHeightLimit) {
        setState({ ...state, exceedsHeightLimit: false });
      }
    }
  }, [state, errata]);

  return (
    <div className={styles.errataBox}>
      <div className={styles.header}>
        <h4>{errata.message}</h4>
        <pre>{errata.code}</pre>
      </div>
      <div className={cx(styles.markdownContent, expanded || !shrink ? styles.expanded : undefined)}>
        <span ref={errorContentRef}>
          <DangerouslySetHtmlContent html={markdownContent}>{markdownContent}</DangerouslySetHtmlContent>
        </span>
        {shrink && !expanded && exceedsHeightLimit && <span className={styles.fader}></span>}
      </div>
      {shrink && exceedsHeightLimit && (
        <Button
          className={cx(clearButtonStyles(theme), styles.showMoreButton)}
          variant="secondary"
          onClick={(e) => {
            setState({ ...state, expanded: !expanded });
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
          <Icon size="lg" name={expanded ? 'angle-up' : 'angle-down'}></Icon>
        </Button>
      )}
    </div>
  );
}

const getErrataStyles = (theme: GrafanaTheme2) => ({
  showMoreButton: css({
    fontWeight: 'normal',
    color: theme.colors.text.secondary,
    '&:hover': {
      background: 'transparent',
      boxShadow: 'none',
    },
  }),

  errataBox: css({
    padding: theme.spacing(1),
  }),
  markdownContent: css({
    maxHeight: '50px',
    overflow: 'hidden',
    position: 'relative',

    '& a': {
      textDecoration: 'underline',
    },

    '& h2': {
      fontSize: theme.typography.h5.fontSize,
    },
    '& h3': {
      fontSize: theme.typography.h6.fontSize,
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

  header: css({
    display: 'flex',
    flexDirection: 'column',
    '& pre': {
      backgroundColor: 'transparent',
      border: 'none',
      padding: 0,
      color: theme.colors.text.secondary,
    },
  }),
});
