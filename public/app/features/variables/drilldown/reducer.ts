import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getInstanceState } from '../state/selectors';
import { initialVariablesState, VariablePayload, VariablesState } from '../state/types';
import { DrilldownVariable, initialVariableModelState, VariableHide } from '../types';

export const initialDrilldownVariableModelState: DrilldownVariable = {
  ...initialVariableModelState,
  type: 'drilldown',
  hide: VariableHide.dontHide,
  current: { value: [] },
};

export const drilldownVariableSlice = createSlice({
  name: 'templating/drilldown',
  initialState: initialVariablesState,
  reducers: {
    updateDrilldownVariable: (
      state: VariablesState,
      action: PayloadAction<VariablePayload<Array<{ dimension: string; value: string }>>>
    ) => {
      const instanceState = getInstanceState<DrilldownVariable>(state, action.payload.id);
      instanceState.current = { value: action.payload.data };
    },
  },
});

export const drilldownVariableReducer = drilldownVariableSlice.reducer;

export const { updateDrilldownVariable } = drilldownVariableSlice.actions;
