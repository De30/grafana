import { Location } from 'history';

import { locationUtil, NavModel, NavModelItem } from '@grafana/data';
import { config } from '@grafana/runtime';
import { contextSrv } from 'app/core/core';
import { AccessControlAction } from 'app/types';

import { DashboardModel } from './DashboardModel';

export function buildDashboardNavModel(
  dashboard: DashboardModel,
  editview: string | undefined,
  location: Location<any>
): NavModel {
  let node: NavModelItem = {
    id: 'dashboard',
    text: dashboard.title,
    icon: 'apps',
    active: true,
    url: locationUtil.getUrlForPartial(location, { editview: null }),
    parentItem: {
      id: 'dashboard',
      text: 'Dashbords',
    },
    children: [],
  };

  if (dashboard.meta.folderTitle) {
    node.parentItem = {
      id: 'folder',
      text: dashboard.meta.folderTitle,
      url: `/dashboards/f/${dashboard.meta.folderUid}`,
      parentItem: node.parentItem,
    };
  }

  let main = node;

  if (editview) {
    const children: NavModelItem[] = [];

    if (dashboard.meta.canEdit) {
      children.push({
        text: 'Settings',
        id: 'settings',
      });

      children.push({
        text: 'Annotations',
        id: 'annotations',
        // icon: 'comment-alt',
      });

      children.push({
        text: 'Variables',
        id: 'templating',
        // icon: 'calculator-alt',
      });

      children.push({
        text: 'Links',
        id: 'links',
        // icon: 'link',
        // component: <LinksSettings dashboard={dashboard} />,
      });
    }

    if (dashboard.meta.canMakeEditable) {
      children.push({
        text: 'General',
        id: 'settings',
        // icon: 'sliders-v-alt',
        // component: <MakeEditable onMakeEditable={onMakeEditable} />,
      });
    }

    if (dashboard.id && dashboard.meta.canSave) {
      children.push({
        text: 'Versions',
        id: 'versions',
        // icon: 'history',
        // component: <VersionsSettings dashboard={dashboard} />,
      });
    }

    if (dashboard.id && dashboard.meta.canAdmin) {
      if (!config.featureToggles['accesscontrol']) {
        children.push({
          text: 'Permissions',
          id: 'permissions',
          // icon: 'lock',
          // component: <DashboardPermissions dashboard={dashboard} />,
        });
      } else if (contextSrv.hasPermission(AccessControlAction.DashboardsPermissionsRead)) {
        children.push({
          text: 'Permissions',
          id: 'permissions',
          // icon: 'lock',
          // component: <AccessControlDashboardPermissions dashboard={dashboard} />,
        });
      }
    }

    children.push({
      text: 'JSON Model',
      id: 'dashboard_json',
      // icon: 'arrow',
      // component: <JsonEditorSettings dashboard={dashboard} />,
    });

    main.children = children;

    for (const child of main.children) {
      child.url = locationUtil.getUrlForPartial(location, { editview: child.id });
      if (child.id === editview) {
        child.active = child.id === editview;
        node = child;
        node.parentItem = main;
        main.active = false;
      }
    }
  }

  return {
    main,
    node,
  };
}
