import { BusEventWithPayload } from '@grafana/data';

import { SceneObject, SceneObjectState, SceneObjectWithUrlSync } from './types';

export interface SceneObjectStateChangedPayload {
  prevState: SceneObjectState;
  newState: SceneObjectState;
  partialUpdate: Partial<SceneObjectState>;
  changedObject: SceneObject | SceneObjectWithUrlSync;
}

export class SceneObjectStateChangedEvent extends BusEventWithPayload<SceneObjectStateChangedPayload> {
  static type = 'scene-object-state-change';
}

export interface SceneObjectDragStartPayload {
  obj: SceneObject;
}

export class SceneObjectDragStart extends BusEventWithPayload<SceneObjectDragStartPayload> {
  static type = 'scene-object-drag-start';
}

export interface SceneObjectDropPayload {
  obj: SceneObject;
}

export class SceneObjectDrop extends BusEventWithPayload<SceneObjectDropPayload> {
  static type = 'scene-object-drop';
}
