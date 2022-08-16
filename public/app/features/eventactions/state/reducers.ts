import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  EventActionsDTO,
  EventActionsProfileState,
  EventActionsState,
  EventActionStateFilter,
} from 'app/types';

// eventActionsProfilePage
export const initialStateProfile: EventActionsProfileState = {
  eventAction: {} as EventActionsDTO,
  isLoading: true,
};

export const eventActionProfileSlice = createSlice({
  name: 'eventaction',
  initialState: initialStateProfile,
  reducers: {
    eventActionFetchBegin: (state) => {
      return { ...state, isLoading: true };
    },
    eventActionFetchEnd: (state) => {
      return { ...state, isLoading: false };
    },
    eventActionLoaded: (state, action: PayloadAction<EventActionsDTO>): EventActionsProfileState => {
      return { ...state, eventAction: action.payload, isLoading: false };
    },
  },
});

export const eventActionProfileReducer = eventActionProfileSlice.reducer;
export const { eventActionLoaded, eventActionFetchBegin, eventActionFetchEnd } =
  eventActionProfileSlice.actions;

// eventActionsListPage
export const initialStateList: EventActionsState = {
  eventActions: [] as EventActionsDTO[],
  isLoading: true,
  query: '',
  page: 0,
  perPage: 50,
  totalPages: 1,
  showPaging: false,
  eventActionStateFilter: EventActionStateFilter.All,
};

interface EventActionsFetched {
  eventActions: EventActionsDTO[];
  perPage: number;
  page: number;
  totalCount: number;
}

const eventActionsSlice = createSlice({
  name: 'eventactions',
  initialState: initialStateList,
  reducers: {
    eventActionsFetched: (state, action: PayloadAction<EventActionsFetched>): EventActionsState => {
      const { totalCount, perPage, ...rest } = action.payload;
      const totalPages = Math.ceil(totalCount / perPage);

      return {
        ...state,
        ...rest,
        totalPages,
        perPage,
        showPaging: totalPages > 1,
        isLoading: false,
      };
    },
    eventActionsFetchBegin: (state) => {
      return { ...state, isLoading: true };
    },
    eventActionsFetchEnd: (state) => {
      return { ...state, isLoading: false };
    },
    queryChanged: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        query: action.payload,
        page: 0,
      };
    },
    pageChanged: (state, action: PayloadAction<number>) => ({
      ...state,
      page: action.payload,
    }),
    stateFilterChanged: (state, action: PayloadAction<EventActionStateFilter>) => ({
      ...state,
      eventActionStateFilter: action.payload,
    }),
  },
});
export const eventActionsReducer = eventActionsSlice.reducer;

export const {
  eventActionsFetchBegin,
  eventActionsFetchEnd,
  eventActionsFetched,
  pageChanged,
  stateFilterChanged,
  queryChanged,
} = eventActionsSlice.actions;

export default {
  eventActionProfile: eventActionProfileReducer,
  eventActions: eventActionsReducer,
};
