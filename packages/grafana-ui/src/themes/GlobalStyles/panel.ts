import { css } from '@emotion/react';

import { GrafanaTheme2 } from '@grafana/data';

export function getOldPanelStyles(theme: GrafanaTheme2) {
  return css`
    .panel {
      height: 100%;
    }

    .panel-height-helper {
      display: block;
      height: 100%;
    }

    .panel-container {
      background-color: ${theme.components.panel.background};
      border: 1px solid ${theme.components.panel.borderColor};
      position: relative;
      border-radius: 3px;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      box-shadow: ${theme.components.panel.boxShadow};

      &--transparent {
        background-color: transparent;
        border: 1px solid transparent;
        box-shadow: none;
      }

      &:hover {
        .panel-menu-toggle {
          visibility: visible;
          transition: opacity 0.1s ease-in 0.2s;
          opacity: 1;
        }
      }

      &--is-editing {
        height: auto;
      }

      &--absolute {
        position: absolute;
      }
    }

    .panel-content {
      padding: ${theme.spacing(theme.components.panel.padding)};
      width: 100%;
      flex-grow: 1;
      contain: strict;
      height: calc(100% - #{${theme.spacing(theme.components.panel.headerHeight)}});

      &--no-padding {
        padding: 0;
      }
    }

    div.flot-text {
      color: ${theme.colors.text.primary} !important;
    }

    .dashboard-solo {
      .footer,
      .sidemenu {
        display: none;
      }
    }

    .template-variable {
      color: $variable;
    }

    .panel-solo {
      position: fixed;
      bottom: 0;
      right: 0;
      margin: 0;
      left: 0;
      top: 0;
      width: '100%';
      height: '100%';

      .panel-container {
        border: none;
      }

      .panel-menu-toggle,
      .panel-menu {
        display: none;
      }
    }
  `;
}
