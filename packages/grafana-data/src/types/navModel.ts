import { ComponentType } from 'react';

export enum NavFlag {
  IsDivider = 0,
  HideFromMenu = 1 << 1,
  HideFromTabs = 1 << 2,
  ShowIconInNavbar = 1 << 3,
  RoundIcon = 1 << 3,
}

export function hasFlag(value: number, flag: NavFlag) {
  // yes, this is a bitwise AND
  return flag === (value & flag);
}

export interface NavLinkDTO {
  id?: string;
  text: string;
  description?: string;
  section?: NavSection;
  subTitle?: string;
  icon?: string;
  img?: string;
  url?: string;
  target?: string;
  sortWeight?: number;
  // divider?: boolean;
  // hideFromMenu?: boolean;
  // hideFromTabs?: boolean;
  // showIconInNavbar?: boolean;
  children?: NavLinkDTO[];
  highlightText?: string;
  emptyMessageId?: string;
  flags: number;
}

export interface NavModelItem extends NavLinkDTO {
  children?: NavModelItem[];
  active?: boolean;
  breadcrumbs?: NavModelBreadcrumb[];
  parentItem?: NavModelItem;
  showOrgSwitcher?: boolean;
  onClick?: () => void;
  menuItemType?: NavMenuItemType;
  highlightText?: string;
  highlightId?: string;
  tabSuffix?: ComponentType<{ className?: string }>;
  hideFromBreadcrumbs?: boolean;
}

export enum NavSection {
  Core = 'core',
  Plugin = 'plugin',
  Config = 'config',
}

export enum NavMenuItemType {
  Section = 'section',
  Item = 'item',
}

/**
 *  Interface used to describe  different kinds of page titles and page navigation. Navmodels are usually generated in the backend and stored in Redux.
 */
export interface NavModel {
  /**
   *  Main page. that wraps the navigation. Generate the `children` property generate tabs when used with the Page component.
   */
  main: NavModelItem;
  /**
   *   This is the current active tab/navigation.
   */
  node: NavModelItem;
}

export interface NavModelBreadcrumb {
  title: string;
  url?: string;
}

export type NavIndex = { [s: string]: NavModelItem };
