import { cleanUpAction } from 'app/core/actions/cleanUp';
import { Middleware } from 'redux';

export const cleanupMiddleware: Middleware = (store) => (next) => (action) => {
  if (action.type === cleanUpAction.type) {
    const { stateSelector } = action.payload;
    const state = store.getState();
    const stateSlice = stateSelector(state);
    recursiveCleanState(state, stateSlice);
  }
  return next(action);
};

const recursiveCleanState = (state: any, stateSlice: any): boolean => {
  for (const stateKey in state) {
    if (!state.hasOwnProperty(stateKey)) {
      continue;
    }

    const slice = state[stateKey];
    if (slice === stateSlice) {
      state[stateKey] = undefined;
      return true;
    }

    if (typeof slice === 'object') {
      const cleaned = recursiveCleanState(slice, stateSlice);
      if (cleaned) {
        return true;
      }
    }
  }

  return false;
};
