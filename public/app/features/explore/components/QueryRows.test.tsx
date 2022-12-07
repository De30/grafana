import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { DataQuery, OrgRole } from '@grafana/data';
import { setDataSourceSrv } from '@grafana/runtime';
import { configureStore } from 'app/store/configureStore';
import { ExploreId, ExploreState } from 'app/types';

import { makeExplorePaneState } from '../state/utils';

import { QueryRows } from './QueryRows';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  reportInteraction: () => null,
}));

function setup(queries: DataQuery[]) {
  const defaultDs = {
    name: 'newDs',
    uid: 'newDs-uid',
    meta: { id: 'newDs' },
  };

  const datasources: Record<string, any> = {
    'newDs-uid': defaultDs,
    'someDs-uid': {
      name: 'someDs',
      uid: 'someDs-uid',
      meta: { id: 'someDs' },
      components: {
        QueryEditor: () => 'someDs query editor',
      },
    },
  };

  setDataSourceSrv({
    getList() {
      return Object.values(datasources).map((d) => ({ name: d.name }));
    },
    getInstanceSettings(uid: string) {
      return datasources[uid] || defaultDs;
    },
    get(uid?: string) {
      return Promise.resolve(uid ? datasources[uid] || defaultDs : defaultDs);
    },
  } as any);

  const leftState = makeExplorePaneState();
  const initialState: ExploreState = {
    left: {
      ...leftState,
      richHistory: [],
      datasourceInstance: datasources['someDs-uid'],
      queries,
    },
    syncedTimes: false,
    correlations: [],
    richHistoryStorageFull: false,
    richHistoryLimitExceededWarningShown: false,
    richHistoryMigrationFailed: false,
  };
  const store = configureStore({
    explore: initialState,
    user: {
      orgId: 1,
      fiscalYearStartMonth: 1,
      isUpdating: false,
      orgs: [{ name: 'Main Org.', orgId: 1, role: OrgRole.Admin }],
      orgsAreLoading: false,
      sessions: [],
      sessionsAreLoading: false,
      weekStart: 'monday',
      teams: [],
      teamsAreLoading: false,
      timeZone: 'utc',
      user: {
        id: 1,
        isGrafanaAdmin: true,
        isDisabled: false,
        email: 'test@grafana.com',
        login: 'test',
        name: 'test',
        theme: 'dark',
      },
    },
  });

  return {
    store,
    datasources,
  };
}

describe('Explore QueryRows', () => {
  it('Should duplicate a query and generate a valid refId', async () => {
    const { store } = setup([{ refId: 'A' }]);

    render(
      <Provider store={store}>
        <QueryRows exploreId={ExploreId.left} />
      </Provider>
    );

    // waiting for the d&d component to fully render.
    await screen.findAllByText('someDs query editor');

    expect(screen.queryByLabelText('Query editor row title B')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Duplicate query/i }));

    // We should have another row with refId B
    await waitFor(() => {
      expect(screen.getByLabelText('Query editor row title B')).toBeInTheDocument();
    });
  });
});
