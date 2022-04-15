import { Store } from 'redux';

import { initialKeyedVariablesState } from 'app/features/variables/state/keyedVariablesReducer';
import { StoreState } from 'app/types';

interface InjectableStore<T> extends Store<T> {
  injectReducer: any;
  removeReducer: any;
}

export let store: InjectableStore<StoreState>;

export function setStore(newStore: InjectableStore<StoreState>) {
  store = newStore;
}

export function getState(): StoreState {
  if (!store || !store.getState) {
    return { templating: { ...initialKeyedVariablesState, lastKey: 'key' } } as StoreState; // used by tests
  }

  return store.getState();
}

export function dispatch(action: any) {
  if (!store || !store.getState) {
    return;
  }

  return store.dispatch(action);
}
