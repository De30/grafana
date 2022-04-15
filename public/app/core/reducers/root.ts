import { AnyAction, combineReducers } from 'redux';
import sharedReducers from 'app/core/reducers';
import alertingReducers from 'app/features/alerting/state/reducers';
import teamsReducers from 'app/features/teams/state/reducers';
import apiKeysReducers from 'app/features/api-keys/state/reducers';
import foldersReducers from 'app/features/folders/state/reducers';
import dashboardReducers from 'app/features/dashboard/state/reducers';
import { reducer as pluginsReducer } from 'app/features/plugins/admin/state/reducer';
import dataSourcesReducers from 'app/features/datasources/state/reducers';
import usersReducers from 'app/features/users/state/reducers';
import invitesReducers from 'app/features/invites/state/reducers';
import userReducers from 'app/features/profile/state/reducers';
import organizationReducers from 'app/features/org/state/reducers';
import ldapReducers from 'app/features/admin/state/reducers';
import importDashboardReducers from 'app/features/manage-dashboards/state/reducers';
import panelEditorReducers from 'app/features/dashboard/components/PanelEditor/state/reducers';
import panelsReducers from 'app/features/panel/state/reducers';
import serviceAccountsReducer from 'app/features/serviceaccounts/state/reducers';
import templatingReducers from 'app/features/variables/state/keyedVariablesReducer';

export const staticReducers = {
  ...sharedReducers,
  ...alertingReducers,
  ...teamsReducers,
  ...apiKeysReducers,
  ...foldersReducers,
  ...dashboardReducers,
  ...dataSourcesReducers,
  ...usersReducers,
  ...serviceAccountsReducer,
  ...userReducers,
  ...invitesReducers,
  ...organizationReducers,
  ...ldapReducers,
  ...importDashboardReducers,
  ...panelEditorReducers,
  ...panelsReducers,
  ...templatingReducers,
  plugins: pluginsReducer,
};

export const createRootReducer = () => {
  const appReducer = combineReducers({
    ...staticReducers,
  });

  return (state: any, action: AnyAction) => {
    // if (action.type === cleanUpAction.type) {
    //   const { stateSelector } = action.payload as CleanUp<any>;
    //   const stateSlice = stateSelector(state);
    //   recursiveCleanState(state, stateSlice);
    // }

    return appReducer(state, action);
  };
};

//
