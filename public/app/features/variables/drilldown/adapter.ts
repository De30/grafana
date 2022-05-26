import { ComponentType } from 'react';

import { dispatch } from 'app/store/store';

import { VariableAdapter } from '../adapters';
import { VariableEditorProps } from '../editor/types';
import { DrilldownVariable, initialVariableModelState, VariableHide } from '../types';

import { DrilldownPicker } from './DrilldownPicker';
import { applyDrillDownDimensions } from './actions';
import { drilldownVariableReducer } from './reducer';

export const createDrilldownVariableAdapter = (): VariableAdapter<DrilldownVariable> => {
  return {
    id: 'drilldown',
    description: '',
    name: 'drilldown',
    initialState: {
      ...initialVariableModelState,
      type: 'drilldown',
      hide: VariableHide.hideLabel,
      skipUrlSync: false,
      current: { value: { dashboard: [] } },
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
      //TODO Decide on a better base64 encoder
      const appliedDrilldownDimensions = JSON.parse(atob(urlValue as string));
      const promises = Object.keys(appliedDrilldownDimensions.value).map((key: string) => {
        return dispatch(applyDrillDownDimensions({ key: key, value: appliedDrilldownDimensions.value[key] }));
      });

      await Promise.all(promises);
    },
    updateOptions: async (variable) => {
      return;
    },
    getSaveModel: (variable) => {
      return {};
    },
    getValueForUrl: (variable) => {
      //TODO Decide on a better base64 encoder
      return btoa(JSON.stringify(variable.current));
    },
  };
};
