import { css } from '@emotion/react';

import { GrafanaTheme2 } from '@grafana/data';

export function getOldDropdownStyles(theme: GrafanaTheme2) {
  return css`
    //
    // Dropdown menus
    // --------------------------------------------------

    // Use the .menu class on any <li> element within the topbar or ul.tabs and you'll get some superfancy dropdowns
    .dropup,
    .dropdown {
      position: relative;
    }

    .dropdown-toggle:active,
    .open .dropdown-toggle {
      outline: 0;
    }

    .dropdown-desc {
      position: relative;
      top: -3px;
      width: 250px;
      font-size: ${theme.typography.bodySmall.fontSize};
      margin-left: 22px;
      color: ${theme.colors.text.secondary};
      white-space: normal;
    }

    // Dropdown arrow/caret
    // --------------------
    .caret {
      display: inline-block;
      width: 0;
      height: 0;
      vertical-align: top;
      border-top: 4px solid ${theme.colors.text.secondary};
      border-right: 4px solid transparent;
      border-left: 4px solid transparent;
      content: '';
    }

    // Place the caret
    .dropdown .caret {
      margin-top: 8px;
      margin-left: 2px;
    }

    // The dropdown menu (ul)
    // ----------------------
    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: ${theme.zIndex.dropdown};
      display: none; // none by default, but block on "open" of the menu
      float: left;
      min-width: 140px;
      margin: 2px 0 0; // override default ul
      list-style: none;
      background-color: ${theme.components.dropdown.background};
      text-align: left;

      // Aligns the dropdown menu to right
      &.pull-left {
        right: 0;
        left: auto;
      }

      .divider {
        height: 1px;
        margin: $space-sm 0; // 8px 1px
        overflow: hidden;
        background-color: ${theme.colors.border.medium};
        border-bottom: 1px solid $dropdownDividerBottom;
      }

      // Links within the dropdown menu
      > li {
        > a,
        > button {
          display: block;
          padding: 3px 20px 3px 15px;
          clear: both;
          font-weight: normal;
          line-height: ${theme.typography.body.lineHeight};
          color: ${theme.colors.text.primary};
          white-space: nowrap;

          i {
            display: inline-block;
            margin-right: 10px;
            color: ${theme.colors.text.secondary};
            position: relative;
            top: 3px;
          }

          .gicon {
            opacity: 0.7;
            width: 18px;
            height: 14px;
          }
        }
      }

      &--menu {
        background: ${theme.components.dropdown.background};
        box-shadow: ${theme.shadows.z3};
        margin-top: 0px;

        > li > a,
        > li > button {
          display: flex;
          padding: 5px 10px;
          border-left: 2px solid transparent;

          &:hover {
            color: ${theme.colors.text.primary};
            background: ${theme.colors.action.hover} !important;
          }
        }
      }
    }

    .dropdown-item-text {
      flex-grow: 1;
    }

    // Hover/Focus state
    // -----------
    .dropdown-menu > li > a:hover,
    .dropdown-menu > li > a:focus,
    .dropdown-submenu:hover > a,
    .dropdown-submenu:focus > a,
    .dropdown-menu > li > button:hover,
    .dropdown-menu > li > button:focus,
    .dropdown-submenu:hover > button,
    .dropdown-submenu:focus > button {
      text-decoration: none;
      color: ${theme.colors.text.primary};
      background: ${theme.colors.action.focus};
    }

    // Active state
    // ------------
    .dropdown-menu > .active > a,
    .dropdown-menu > .active > a:hover,
    .dropdown-menu > .active > a:focus,
    .dropdown-menu > .active > button,
    .dropdown-menu > .active > button:hover,
    .dropdown-menu > .active > button:focus {
      color: ${theme.colors.text.primary};
      text-decoration: none;
      outline: 0;
      background: ${theme.colors.action.focus};
    }

    // Disabled state
    // --------------
    // Gray out text and ensure the hover/focus state remains gray
    .dropdown-menu > .disabled > a,
    .dropdown-menu > .disabled > a:hover,
    .dropdown-menu > .disabled > a:focus,
    .dropdown-menu > .disabled > button,
    .dropdown-menu > .disabled > button:hover,
    .dropdown-menu > .disabled > button:focus {
      color: ${theme.colors.action.disabledText};
    }
    // Nuke hover/focus effects
    .dropdown-menu > .disabled > a:hover,
    .dropdown-menu > .disabled > a:focus,
    .dropdown-menu > .disabled > button:hover,
    .dropdown-menu > .disabled > button:focus {
      text-decoration: none;
      background-color: transparent;
      background-image: none; // Remove CSS gradient
      cursor: default;
    }

    // Open state for the dropdown
    // ---------------------------
    .open {
      > .dropdown-menu {
        display: block;
      }

      > .dropdown > .dropdown-menu {
        // Panel menu. TODO: See if we can merge this with above
        display: block;
      }

      &.cascade-open {
        .dropdown-menu {
          display: block;
        }
      }
    }

    // Backdrop to catch body clicks on mobile, etc.
    // ---------------------------
    .dropdown-backdrop {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      z-index: ${theme.zIndex.dropdown} - 10;
    }

    // Right aligned dropdowns
    // ---------------------------
    .pull-right > .dropdown-menu {
      left: 100%;
      right: unset;
    }

    // Allow for dropdowns to go bottom up (aka, dropup-menu)
    // ------------------------------------------------------
    // Just add .dropup after the standard .dropdown class and you're set, bro.
    // TODO: abstract this so that the navbar fixed styles are not placed here?
    .dropup,
    .navbar-fixed-bottom .dropdown {
      // Reverse the caret
      .caret {
        border-top: 0;
        border-bottom: 4px solid ${theme.colors.text.primary};
        content: '';
      }
      // Different positioning for bottom up menu
      .dropdown-menu {
        top: auto;
        bottom: 0;
        margin-bottom: 1px;
      }
    }

    // Sub menus
    // ---------------------------
    .dropdown-submenu {
      position: relative;
    }

    // Default dropdowns
    .dropdown-submenu > .dropdown-menu {
      top: 0;
      left: 100%;
      margin-top: 0px;
      margin-left: -1px;
    }
    .dropdown-submenu:hover > .dropdown-menu {
      display: block;
    }

    // Dropups
    .dropup .dropdown-submenu > .dropdown-menu {
      top: auto;
      bottom: 0;
      margin-top: 0;
      margin-bottom: -2px;
    }
    .dropdown-submenu:hover > a::after,
    .dropdown-submenu:hover > button::after {
      border-left-color: ${theme.colors.text.primary};
    }

    // Left aligned submenus
    .dropdown-submenu.pull-left {
      // Undo the float
      // Yes, this is awkward since .pull-left adds a float, but it sticks to our conventions elsewhere.
      float: none !important;

      // Positioning the submenu
      > .dropdown-menu {
        left: -100%;
        width: 100%;
        margin-left: 2px;
      }
    }

    .dropdown-submenu.pull-right {
      float: none !important;
    }

    // Tweak nav headers
    // -----------------
    // Increase padding from 15px to 20px on sides
    .dropdown .dropdown-menu .nav-header {
      padding-left: 20px;
      padding-right: 20px;
    }

    // Typeahead
    // ---------
    .typeahead {
      z-index: ${theme.zIndex.typeahead};
    }

    .dropdown-menu-item-shortcut {
      display: block;
      margin-left: ${theme.spacing(2)};
      color: ${theme.colors.text.secondary};
      min-width: 47px;
    }

    .dropdown-menu.dropdown-menu--new {
      li a,
      li button {
        padding: ${theme.spacing(1, 2)};
        border-left: 2px solid ${theme.colors.background.primary};
        background: ${theme.colors.background.primary};

        i {
          display: inline-block;
          padding-right: 21px;
        }

        &:hover {
          color: ${theme.colors.text.primary};
          background: ${theme.colors.action.hover};
        }
      }
    }
  `;
}
