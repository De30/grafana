import React from 'react';

import { VariableHide } from '@grafana/data';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneComponentProps, SceneObject, SceneObjectStatePlain } from '../../core/types';
import { SceneVariableState } from '../types';

import { VariableLabel } from './VariableLabel';

export class VariableValueSelectors extends SceneObjectBase<SceneObjectStatePlain> {
  public static Component = VariableValueSelectorsRenderer;
}

function VariableValueSelectorsRenderer({ model }: SceneComponentProps<VariableValueSelectors>) {
  const variables = sceneGraph.getVariables(model)!.useState();

  return (
    <>
      {variables.variables.map((variable) => (
        <VariableValueSelectWrapper key={variable.state.key} variable={variable} />
      ))}
    </>
  );
}

function VariableValueSelectWrapper({ variable }: { variable: SceneObject<SceneVariableState> }) {
  const state = variable.useState();

  if (state.hide === VariableHide.hideVariable) {
    return null;
  }

  return (
    <div className="gf-form-inline">
      <VariableLabel state={state} />
      <variable.Component model={variable} />
    </div>
  );
}
