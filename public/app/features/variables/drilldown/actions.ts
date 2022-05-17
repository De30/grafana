import { TemplateSrv, getTemplateSrv } from 'app/features/templating/template_srv';
import { ThunkResult } from 'app/types';

import { variableUpdated } from '../state/actions';
import { toKeyedAction } from '../state/keyedVariablesReducer';
import { getLastKey, getVariablesState, getVariable } from '../state/selectors';
import { KeyedVariableIdentifier } from '../state/types';
import { toKeyedVariableIdentifier, toVariablePayload } from '../utils';

import { updateDrilldownVariable } from './reducer';

type DrilldownDimensionOptions = Array<{ dimension: string; value: any }>;

interface ApplyDrillDownDimensionsDependencies {
  templateSrv: TemplateSrv;
}

export const applyDrillDownDimensions = (
  options: DrilldownDimensionOptions,
  dependencies: ApplyDrillDownDimensionsDependencies = {
    templateSrv: getTemplateSrv(),
  }
): ThunkResult<void> => {
  return async (dispatch, getState) => {
    const key = getLastKey(getState());

    const templatingState = getVariablesState(key, getState());
    const drilldownState = templatingState.variables['__drilldown'];
    const identifier: KeyedVariableIdentifier = toKeyedVariableIdentifier(drilldownState);
    const variable = getVariable(identifier, getState());

    dispatch(
      toKeyedAction(
        key,
        updateDrilldownVariable(toVariablePayload<Array<{ dimension: string; value: string }>>(identifier, options))
      )
    );
    await dispatch(variableUpdated(toKeyedVariableIdentifier(variable), true));
  };
};
