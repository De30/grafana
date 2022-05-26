import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getInstanceState } from '../state/selectors';
import { initialVariablesState, VariablePayload, VariablesState } from '../state/types';
import { DrilldownVariable, initialVariableModelState, VariableHide } from '../types';

import { UpdateDrilldownVariablePayload } from './actions';

export const initialDrilldownVariableModelState: DrilldownVariable = {
  ...initialVariableModelState,
  type: 'drilldown',
  hide: VariableHide.dontHide,
  current: { value: { dashboard: [] } },
};

export const drilldownVariableSlice = createSlice({
  name: 'templating/drilldown',
  initialState: initialVariablesState,
  reducers: {
    updateDrilldownVariable: (
      state: VariablesState,
      action: PayloadAction<VariablePayload<UpdateDrilldownVariablePayload>>
    ) => {
      const instanceState = getInstanceState<DrilldownVariable>(state, action.payload.id);
      instanceState.current = {
        value: { ...instanceState.current.value, [action.payload.data.key]: action.payload.data.value },
      };
    },
  },
});

export const drilldownVariableReducer = drilldownVariableSlice.reducer;

export const { updateDrilldownVariable } = drilldownVariableSlice.actions;
