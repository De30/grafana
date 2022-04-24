import { css, cx } from '@emotion/css';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { useOverlay } from '@react-aria/overlays';
import React, { useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { GrafanaTheme2, locationUtil, NavModel } from '@grafana/data';
import { locationService, reportInteraction } from '@grafana/runtime';
import { Button, CustomScrollbar, Icon, IconName, stylesFactory, useForceUpdate } from '@grafana/ui';
import { PagePanes } from 'app/core/components/Page/Page';
import config from 'app/core/config';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types';

import { VariableEditorContainer } from '../../../variables/editor/VariableEditorContainer';
import { DashboardModel } from '../../state/DashboardModel';
import { AccessControlDashboardPermissions } from '../DashboardPermissions/AccessControlDashboardPermissions';
import { DashboardPermissions } from '../DashboardPermissions/DashboardPermissions';
import { SaveDashboardAsButton, SaveDashboardButton } from '../SaveDashboard/SaveDashboardButton';

import { AnnotationsSettings } from './AnnotationsSettings';
import { GeneralSettings } from './GeneralSettings';
import { JsonEditorSettings } from './JsonEditorSettings';
import { LinksSettings } from './LinksSettings';
import { VersionsSettings } from './VersionsSettings';

export interface Props {
  dashboard: DashboardModel;
  editview: string;
}

export interface SettingsPage {
  id: string;
  title: string;
  icon: IconName;
  component: React.ReactNode;
}

const onClose = () => locationService.partial({ editview: null });

const MakeEditable = (props: { onMakeEditable: () => any }) => (
  <div>
    <div className="dashboard-settings__header">Dashboard not editable</div>
    <Button onClick={props.onMakeEditable}>Make editable</Button>
  </div>
);

export function DashboardSettings({ dashboard, editview }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { overlayProps } = useOverlay({}, ref);
  const { dialogProps } = useDialog(
    {
      'aria-label': 'Dashboard settings',
    },
    ref
  );
  const forceUpdate = useForceUpdate();
  const onMakeEditable = useCallback(() => {
    dashboard.editable = true;
    dashboard.meta.canMakeEditable = false;
    dashboard.meta.canEdit = true;
    dashboard.meta.canSave = true;
    forceUpdate();
  }, [dashboard, forceUpdate]);

  const pages = useMemo((): SettingsPage[] => {
    const pages: SettingsPage[] = [];

    if (dashboard.meta.canEdit) {
      pages.push({
        title: 'General',
        id: 'settings',
        icon: 'sliders-v-alt',
        component: <GeneralSettings dashboard={dashboard} />,
      });

      pages.push({
        title: 'Annotations',
        id: 'annotations',
        icon: 'comment-alt',
        component: <AnnotationsSettings dashboard={dashboard} />,
      });

      pages.push({
        title: 'Variables',
        id: 'templating',
        icon: 'calculator-alt',
        component: <VariableEditorContainer dashboard={dashboard} />,
      });

      pages.push({
        title: 'Links',
        id: 'links',
        icon: 'link',
        component: <LinksSettings dashboard={dashboard} />,
      });
    }

    if (dashboard.meta.canMakeEditable) {
      pages.push({
        title: 'General',
        icon: 'sliders-v-alt',
        id: 'settings',
        component: <MakeEditable onMakeEditable={onMakeEditable} />,
      });
    }

    if (dashboard.id && dashboard.meta.canSave) {
      pages.push({
        title: 'Versions',
        id: 'versions',
        icon: 'history',
        component: <VersionsSettings dashboard={dashboard} />,
      });
    }

    if (dashboard.id && dashboard.meta.canAdmin) {
      if (!config.featureToggles['accesscontrol']) {
        pages.push({
          title: 'Permissions',
          id: 'permissions',
          icon: 'lock',
          component: <DashboardPermissions dashboard={dashboard} />,
        });
      } else if (contextSrv.hasPermission(AccessControlAction.DashboardsPermissionsRead)) {
        pages.push({
          title: 'Permissions',
          id: 'permissions',
          icon: 'lock',
          component: <AccessControlDashboardPermissions dashboard={dashboard} />,
        });
      }
    }

    pages.push({
      title: 'JSON Model',
      id: 'dashboard_json',
      icon: 'arrow',
      component: <JsonEditorSettings dashboard={dashboard} />,
    });

    return pages;
  }, [dashboard, onMakeEditable]);

  const onPostSave = () => {
    dashboard.meta.hasUnsavedFolderChange = false;
  };

  // const folderTitle = dashboard.meta.folderTitle;
  const currentPage = pages.find((page) => page.id === editview) ?? pages[0];
  const canSaveAs = contextSrv.hasEditPermissionInFolders;
  const canSave = dashboard.meta.canSave;
  const styles = getStyles(config.theme2);
  const location = useLocation();
  const navModel: NavModel = {
    main: {
      id: 'settings',
      icon: 'apps',
      text: 'Settings',
      children: pages.map((page) => ({
        id: page.id,
        text: page.title,
        active: page.id === editview,
        url: locationUtil.getUrlForPartial(location, { editview: page.id }),
      })),
    },
    node: {
      text: currentPage.title,
      id: currentPage.id,
    },
  };

  return (
    <FocusScope contain autoFocus restoreFocus>
      <div className="dashboard-settings" ref={ref} {...overlayProps} {...dialogProps}>
        <PagePanes navModel={navModel}>{currentPage.component}</PagePanes>
        {/* <CustomScrollbar>
                  {canSave && <SaveDashboardButton dashboard={dashboard} onSaveSuccess={onPostSave} />}
                  {canSaveAs && (
                    <SaveDashboardAsButton dashboard={dashboard} onSaveSuccess={onPostSave} variant="secondary" />
        </CustomScrollbar> */}
      </div>
    </FocusScope>
  );
}

const getStyles = stylesFactory((theme: GrafanaTheme2) => ({
  scrollInner: css`
    min-width: 100%;
    display: flex;
  `,
  settingsWrapper: css`
    margin: ${theme.spacing(0, 2, 2)};
    display: flex;
    flex-grow: 1;
  `,
  settingsContent: css`
    flex-grow: 1;
    height: 100%;
    padding: 32px;
    border: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.primary};
    border-radius: ${theme.shape.borderRadius()};
  `,
}));
