import { ComponentType } from 'react';

import { VariableAdapter } from '../adapters';
import { VariableEditorProps } from '../editor/types';
import { DrilldownVariable, initialVariableModelState, VariableHide } from '../types';

import { DrilldownPicker } from './DrilldownPicker';
import { drilldownVariableReducer } from './reducer';

export const createDrilldownVariableAdapter = (): VariableAdapter<DrilldownVariable> => {
  return {
    id: 'drilldown',
    description: '',
    name: 'drilldown',
    initialState: {
      ...initialVariableModelState,
      type: 'drilldown',
      hide: VariableHide.dontHide,
      skipUrlSync: false,
      current: { value: [] },
    },
    reducer: drilldownVariableReducer,
    picker: DrilldownPicker,
    editor: null as unknown as ComponentType<VariableEditorProps<DrilldownVariable>>,
    dependsOn: () => {
      return false;
    },
    setValue: async (variable, option, emitChanges = false) => {
      return;
    },
    setValueFromUrl: async (variable, urlValue) => {
      return;
    },
    updateOptions: async (variable) => {
      return;
    },
    getSaveModel: (variable) => {
      return {};
    },
    getValueForUrl: (variable) => {
      return '';
    },
  };
};
