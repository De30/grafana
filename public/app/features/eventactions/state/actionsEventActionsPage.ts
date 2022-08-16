import { getBackendSrv, locationService } from '@grafana/runtime';
import { accessControlQueryParam } from 'app/core/utils/accessControl';
import { EventActionsDTO, ThunkResult } from 'app/types';

import {
  eventActionFetchBegin,
  eventActionFetchEnd,
  eventActionLoaded,
} from './reducers';

const BASE_URL = `/api/eventactions`;

export function loadEventAction(id: number): ThunkResult<void> {
  return async (dispatch) => {
    dispatch(eventActionFetchBegin());
    try {
      const response = await getBackendSrv().get(`${BASE_URL}/${id}`, accessControlQueryParam());
      dispatch(eventActionLoaded(response));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(eventActionFetchEnd());
    }
  };
}

export function updateEventAction(eventAction: EventActionsDTO): ThunkResult<void> {
  return async (dispatch) => {
    await getBackendSrv().patch(`${BASE_URL}/${eventAction.id}?accesscontrol=true`, {
      ...eventAction,
    });
    dispatch(loadEventAction(eventAction.id));
  };
}

export function deleteEventAction(eventActionId: number): ThunkResult<void> {
  return async () => {
    await getBackendSrv().delete(`${BASE_URL}/${eventActionId}`);
    locationService.push('/org/eventactions');
  };
}


