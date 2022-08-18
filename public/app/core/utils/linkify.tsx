import { css } from '@emotion/css';
import React, { Children, FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { sanitizeUrl } from '@grafana/data/src/text/sanitize';
import { useStyles2 } from '@grafana/ui';

// @ts-ignore
export const Linkify: FC = ({ children }) => {
  const childrenArray = Children.toArray(children);

  return Children.map(childrenArray, (child) => {
    if (typeof child === 'string' && isValidURL(child)) {
      return <SafeAnchor href={child} />;
    }

    return child;
  });
};

interface SafeAnchorProps {
  href: string;
}

const SafeAnchor: FC<SafeAnchorProps> = ({ href }) => {
  const styles = useStyles2(getStyles);
  const sanitizedURL = sanitizeUrl(href);

  return (
    <a href={sanitizedURL} className={styles.link}>
      {href}
    </a>
  );
};

function isValidURL(input: string) {
  try {
    new URL(input);
    return true;
  } catch (err) {
    return false;
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  link: css`
    word-break: break-all;
    color: ${theme.colors.text.link};
  `,
});
