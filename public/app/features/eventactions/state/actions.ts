import { debounce } from 'lodash';

import { getBackendSrv } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction, EventActionsDTO, EventActionStateFilter, ThunkResult } from 'app/types';

import {
  pageChanged,
  queryChanged,
  eventActionsFetchBegin,
  eventActionsFetched,
  eventActionsFetchEnd,
  stateFilterChanged,
} from './reducers';

const BASE_URL = `/api/eventactions`;


interface FetchEventActionsParams {
  withLoadingIndicator: boolean;
}

export function fetchEventActions(
  { withLoadingIndicator }: FetchEventActionsParams = { withLoadingIndicator: false }
): ThunkResult<void> {
  return async (dispatch, getState) => {
    try {
      if (contextSrv.hasPermission(AccessControlAction.EventActionsRead)) {
        if (withLoadingIndicator) {
          dispatch(eventActionsFetchBegin());
        }
        const { perPage, page, query, eventActionStateFilter } = getState().eventActions;
        const result = await getBackendSrv().get(
          `${BASE_URL}/search?perpage=${perPage}&page=${page}&query=${query}${getStateFilter(
            eventActionStateFilter
          )}&accesscontrol=true`
        );
        dispatch(eventActionsFetched(result));
      }
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(eventActionsFetchEnd());
    }
  };
}

const fetchEventActionsWithDebounce = debounce((dispatch) => dispatch(fetchEventActions()), 500, {
  leading: true,
});

export function updateEventAction(eventAction: EventActionsDTO): ThunkResult<void> {
  return async (dispatch) => {
    await getBackendSrv().patch(`${BASE_URL}/${eventAction.id}?accesscontrol=true`, {
      ...eventAction,
    });
    dispatch(fetchEventActions());
  };
}

export function deleteEventAction(eventActionId: number): ThunkResult<void> {
  return async (dispatch) => {
    await getBackendSrv().delete(`${BASE_URL}/${eventActionId}`);
    dispatch(fetchEventActions());
  };
}


// search / filtering of eventActions
const getStateFilter = (value: EventActionStateFilter) => {
  if (value === EventActionStateFilter.All) {
    return '';
  }
  return `&type=${value}`;
};

export function changeQuery(query: string): ThunkResult<void> {
  return async (dispatch) => {
    dispatch(queryChanged(query));
    fetchEventActionsWithDebounce(dispatch);
  };
}

export function changeStateFilter(filter: EventActionStateFilter): ThunkResult<void> {
  return async (dispatch) => {
    dispatch(stateFilterChanged(filter));
    dispatch(fetchEventActions());
  };
}

export function changePage(page: number): ThunkResult<void> {
  return async (dispatch) => {
    dispatch(pageChanged(page));
    dispatch(fetchEventActions());
  };
}

export async function executeEventAction(eventAction: EventActionsDTO, payload: string): Promise<Response> {
  return fetch(`${BASE_URL}/${eventAction.id}/execute`,
    {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: payload
    });
}
