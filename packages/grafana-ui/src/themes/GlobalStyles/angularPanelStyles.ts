import { css } from '@emotion/react';

import { GrafanaTheme2 } from '@grafana/data';

export function getAgularPanelStyles(theme: GrafanaTheme2) {
  return css`
    .panel-options-group {
      border-bottom: 1px solid ${theme.colors.border.weak};
    }

    .panel-options-group__header {
      padding: ${theme.spacing(1, 2, 1, 1)};
      position: relative;
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 500;
      color: ${theme.colors.text.primary};

      &:hover {
        background: ${theme.colors.emphasize(theme.colors.background.primary, 0.03)};
      }
    }

    .panel-options-group__icon {
      color: ${theme.colors.text.secondary};
      margin-right: ${theme.spacing(1)};
      padding: ${theme.spacing(0, 0.9, 0, 0.6)};
    }

    .panel-options-group__title {
      position: relative;
    }

    .panel-options-group__body {
      padding: ${theme.spacing(1, 2, 1, 4)};
    }

    .grafana-options-table {
      width: 100%;

      th {
        text-align: left;
        padding: 5px 10px;
        border-bottom: 4px solid ${theme.colors.background.primary};
      }

      tr td {
        background: ${theme.colors.background.primary};
        padding: 5px 10px;
        white-space: nowrap;
        border-bottom: 4px solid ${theme.colors.border.weak};

        &.nobg {
          background-color: transparent;
        }
      }

      .max-width-btns {
        padding-right: 0px;
        .btn {
          box-sizing: border-box;
          width: 100%;
        }
      }
    }

    .max-width {
      overflow: hidden;
      text-overflow: ellipsis;
      -o-text-overflow: ellipsis;
      white-space: nowrap;
    }

    .grafana-list-item {
      display: block;
      padding: 1px 10px;
      line-height: 34px;
      background-color: ${theme.colors.background.secondary};
      margin-bottom: 4px;
      cursor: pointer;
    }

    // ==========================================================================
    // FILTER TABLE
    // ==========================================================================

    // Table
    // --------------------------------------------------------------------------

    .filter-table * {
      box-sizing: border-box;
    }

    .filter-table {
      width: 100%;
      border-collapse: separate;

      tbody {
        tr:nth-child(odd) {
          background: ${theme.colors.emphasize(theme.colors.background.primary, 0.03)};
        }
      }

      th {
        width: auto;
        padding: ${theme.spacing(0.5, 1)};
        text-align: left;
        line-height: 30px;
        height: 30px;
        white-space: nowrap;
      }

      td {
        padding: ${theme.spacing(0.5, 1)};
        line-height: 30px;
        height: 30px;
        white-space: nowrap;

        &.filter-table__switch-cell {
          padding: 0;
          border-right: 3px solid ${theme.colors.background.primary};
        }
      }

      .link-td {
        padding: 0;
        line-height: 30px;
        height: 30px;
        white-space: nowrap;

        &.filter-table__switch-cell {
          padding: 0;
          border-right: 3px solid ${theme.colors.background.primary};
        }

        a {
          display: block;
          padding: 0px ${theme.spacing(1)};
          height: 30px;
        }
      }

      .ellipsis {
        display: block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .expanded {
        border-color: ${theme.colors.background.primary};
      }

      .expanded > td {
        padding-bottom: 0;
      }

      .filter-table__avatar {
        width: 25px;
        height: 25px;
        border-radius: 50%;
      }

      &--hover {
        tbody tr:hover {
          background: ${theme.colors.emphasize(theme.colors.background.primary, 0.05)};
        }
      }
    }
    .filter-table__weak-italic {
      font-style: italic;
      color: ${theme.colors.text.secondary};
    }
  `;
}
