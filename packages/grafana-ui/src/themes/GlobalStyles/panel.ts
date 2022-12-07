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
      background: ${theme.components.panel.background};
      border: 1px solid ${theme.components.panel.borderColor};
      position: relative;
      border-radius: ${theme.shape.borderRadius(theme.components.panel.borderRadius)};
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      box-shadow: ${theme.components.panel.boxShadow};

      &--transparent {
        background: transparent;
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

    .panel-header {
      &:hover {
        transition: background-color 0.1s ease-in-out;
        background-color: ${theme.colors.action.hover};
      }
    }

    .panel-container--no-title {
      .panel-header {
        position: absolute;
        left: min(50px, 10%); // allows space for interaction in the corders
        right: min(50px, 10%);
        z-index: ${theme.zIndex.sidemenu};

        &:hover {
          left: 0;
          right: 0;
        }
      }
      .panel-content {
        height: 100%;
      }
    }

    .panel-title-container {
      cursor: move;
      word-wrap: break-word;
      display: block;
    }

    .panel-title {
      border: 0px;
      font-weight: ${theme.typography.fontWeightMedium};
      position: relative;
      width: 100%;
      display: flex;
      flex-wrap: nowrap;
      justify-content: center;
      height: ${theme.spacing(theme.components.panel.headerHeight)};
      line-height: ${theme.spacing(theme.components.panel.headerHeight)};
      align-items: center;
    }

    .panel-menu-container {
      width: 0px;
      height: 19px;
      display: inline-block;
    }

    .panel-menu-toggle {
      position: absolute;
      top: calc(50% - 9px);
      color: ${theme.colors.text.secondary};
      cursor: pointer;
      margin: 2px 0 0 2px;
      visibility: hidden;
      opacity: 0;

      &:hover {
        color: ${theme.colors.text.primary};
      }
    }

    .panel-loading {
      position: absolute;
      top: 0px;
      right: 4px;
      z-index: $panel-header-z-index + 1;
      font-size: $font-size-lg;
      color: ${theme.colors.text.secondary};

      &:hover {
        cursor: pointer;
      }
    }

    .panel-empty {
      display: flex;
      align-items: center;
      height: 100%;
      width: 100%;

      p {
        text-align: center;
        color: ${theme.colors.text.secondary};
        font-size: ${theme.typography.h5.fontSize};
        width: 100%;
      }
    }

    .panel-menu {
      top: 25px;
      left: -100px;
    }
  `;
}
