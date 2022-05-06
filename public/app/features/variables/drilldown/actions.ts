import { ThunkResult } from 'app/types';

import { toKeyedAction } from '../state/keyedVariablesReducer';
import { getLastKey, getVariablesState } from '../state/selectors';
import { KeyedVariableIdentifier } from '../state/types';
import { toKeyedVariableIdentifier, toVariablePayload } from '../utils';

import { updateDrilldownVariable } from './reducer';

type DrilldownDimensionOptions = Array<{ dimension: string; value: any }>;

export const applyDrillDownDimensions = (options: DrilldownDimensionOptions): ThunkResult<void> => {
  return async (dispatch, getState) => {
    const key = getLastKey(getState());

    const templatingState = getVariablesState(key, getState());
    const drilldownState = templatingState.variables['__drilldown'];
    const identifier: KeyedVariableIdentifier = toKeyedVariableIdentifier(drilldownState);

    dispatch(
      toKeyedAction(
        key,
        updateDrilldownVariable(toVariablePayload<Array<{ dimension: string; value: string }>>(identifier, options))
      )
    );
  };
};
