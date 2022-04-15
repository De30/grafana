import { configureStore as reduxConfigureStore, MiddlewareArray } from '@reduxjs/toolkit';
import { setStore } from './store';
import { StoreState } from 'app/types/store';
import { buildInitialState } from '../core/reducers/navModel';
import { AnyAction, combineReducers, Reducer } from 'redux';

import { cleanupMiddleware } from './cleanupMiddleware';
import { createRootReducer, staticReducers } from 'app/core/reducers/root';
import { ThunkMiddleware } from 'redux-thunk';

export function configureStore(initialState?: Partial<StoreState>) {
  const store = reduxConfigureStore<
    StoreState,
    AnyAction,
    MiddlewareArray<[ThunkMiddleware<StoreState, AnyAction>, typeof cleanupMiddleware]>
  >({
    reducer: createRootReducer(),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: true, serializableCheck: false, immutableCheck: false }).concat(cleanupMiddleware),
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState: {
      navIndex: buildInitialState(),
      ...initialState,
    },
  });

  const asyncReducers: Record<string, Reducer> = {};

  // Create an inject reducer function
  // This function adds the async reducer, and creates a new combined reducer
  const injectReducer = (key: string, asyncReducer: Reducer) => {
    asyncReducers[key] = asyncReducer;
    store.replaceReducer(createReducer(asyncReducers) as any);
  };

  const removeReducer = (key: string) => {
    delete asyncReducers[key];
    store.replaceReducer(createReducer(asyncReducers) as any);
  };

  const injectableStore = { ...store, injectReducer, removeReducer };
  setStore(injectableStore);
  return injectableStore;
}

function createReducer(asyncReducers: Record<string, Reducer>) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}
