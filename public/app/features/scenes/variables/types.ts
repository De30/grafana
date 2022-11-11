import { Observable } from 'rxjs';

import { BusEventWithPayload } from '@grafana/data';
import { VariableHide } from 'app/features/variables/types';

import { SceneObject, SceneObjectStatePlain } from '../core/types';

export interface SceneVariableState extends SceneObjectStatePlain {
  name: string;
  label?: string;
  hide?: VariableHide;
  skipUrlSync?: boolean;
  loading?: boolean;
  error?: any | null;
  description?: string | null;
  //text: string | string[];
  //value: string | string[]; // old current.value
}

export interface SceneVariable<TState extends SceneVariableState = SceneVariableState> extends SceneObject<TState> {
  /**
   * Should return a string array of other variables this variable is using in it's definition.
   */
  getDependencies?(): string[];

  /**
   * This function is called on activation or when a dependency changes.
   */
  validateAndUpdate?(): Observable<ValidateAndUpdateResult>;

  /**
   * Should return the value for the given field path
   */
  getValue(fieldPath?: string): VariableValue;

  /**
   * Should return the value display text, used by the "text" formatter
   * Example: ${podId:text}
   * Useful for variables that have non user friendly values but friendly display text names.
   */
  getValueText?(): string;
}

export type VariableValue = string | string[] | number | number[] | boolean | boolean[] | null | undefined;

export interface ValidateAndUpdateResult {}
export interface VariableValueOption {
  label: string;
  value: string;
}

export interface SceneVariableSetState extends SceneObjectStatePlain {
  variables: SceneVariable[];
}

export interface SceneVariables extends SceneObject<SceneVariableSetState> {
  getByName(name: string): SceneVariable | undefined;
}

export class SceneVariableValueChangedEvent extends BusEventWithPayload<SceneVariable> {
  public static type = 'scene-variable-changed-value';
}
