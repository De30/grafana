import { ComponentType } from 'react';

import { dispatch } from 'app/store/store';

import { VariableAdapter } from '../adapters';
import { VariableEditorProps } from '../editor/types';
import { DrilldownVariable, initialVariableModelState, VariableHide } from '../types';

import { DrilldownPicker } from './DrilldownPicker';
import { applyDrillDownDimensions, resetDrillDownDimensions } from './actions';
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
      if (urlValue) {
        const appliedDrilldownDimensions = JSON.parse(atob(urlValue as string));
        const promises = Object.keys(appliedDrilldownDimensions.value).map((key: string) => {
          return dispatch(applyDrillDownDimensions({ key: key, value: appliedDrilldownDimensions.value[key] }));
        });

        await Promise.all(promises);
      } else {
        return dispatch(resetDrillDownDimensions());
      }
      //TODO Decide on a better base64 encoder
    },
    updateOptions: async (variable) => {
      return;
    },
    getSaveModel: (variable) => {
      return {};
    },
    getValueForUrl: (variable) => {
      const {
        current: { value },
      } = variable;

      let hasAnyDimensionsApplied = false;

      for (const [_, dim] of Object.entries(value)) {
        if (dim && dim.length > 0) {
          hasAnyDimensionsApplied = true;
          break;
        }
      }

      if (!hasAnyDimensionsApplied) {
        return '';
      }

      return btoa(JSON.stringify(variable.current));
    },
  };
};
