import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { styleMixins } from '@grafana/ui';

export const getStyles = (theme: GrafanaTheme2) => ({
  savedlistSectionHeader: css`
    margin-bottom: ${theme.spacing(2)};
    color: ${theme.colors.secondary.text};
  `,

  savedlistSection: css`
    margin-bottom: ${theme.spacing(2)};
    padding-top: 3px;
  `,

  savedlistLink: css`
    ${styleMixins.listItem(theme)}
    display: flex;
    cursor: pointer;
    margin: 3px;
    padding: 7px;
  `,

  savedlistStar: css`
    align-self: center;
    margin-right: 0px;
    color: ${theme.colors.secondary.text};
    z-index: 1;
  `,

  savedlistFolder: css`
    color: ${theme.colors.secondary.text};
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.body.lineHeight};
  `,

  savedlistTitle: css`
    &::after {
      position: absolute;
      content: '';
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
    }
  `,

  savedlistLinkBody: css`
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  `,

  savedlistItem: css`
    position: relative;
    list-style: none;
  `,

  gridContainer: css`
    display: grid;
    gap: ${theme.spacing(1)};
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    list-style: none;
    margin-bottom: ${theme.spacing(1)};
  `,
});
