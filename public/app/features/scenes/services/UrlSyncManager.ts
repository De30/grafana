import { Location } from 'history';
import { isEqual } from 'lodash';
import { Unsubscribable } from 'rxjs';

import { locationService } from '@grafana/runtime';

import { SceneObjectStateChangedEvent } from '../core/events';
import { SceneObject, SceneObjectUrlValue, SceneObjectUrlValues } from '../core/types';
import { forEachSceneObjectInState } from '../core/utils';

export class UrlSyncManager {
  private locationListenerUnsub: () => void;
  private stateChangeSub: Unsubscribable;
  private initialStates: Map<string, SceneObjectUrlValue> = new Map();
  private urlKeyMapper = new UniqueUrlKeyMapper();

  public constructor(private sceneRoot: SceneObject) {
    this.stateChangeSub = sceneRoot.subscribeToEvent(SceneObjectStateChangedEvent, this.onStateChanged);
    this.locationListenerUnsub = locationService.getHistory().listen(this.onLocationUpdate);
  }

  /**
   * Updates the current scene state to match URL state.
   */
  public initSync() {
    const urlParams = locationService.getSearch();
    this.urlKeyMapper.rebuldIndex(this.sceneRoot);
    this.syncSceneStateFromUrl(this.sceneRoot, urlParams);
  }

  private onLocationUpdate = (location: Location) => {
    const urlParams = new URLSearchParams(location.search);
    // Rebuild key mapper index before starting sync
    this.urlKeyMapper.rebuldIndex(this.sceneRoot);
    // Sync scene state tree from url
    this.syncSceneStateFromUrl(this.sceneRoot, urlParams);
  };

  private onStateChanged = ({ payload }: SceneObjectStateChangedEvent) => {
    const changedObject = payload.changedObject;

    if (changedObject.urlSync) {
      const newUrlState = changedObject.urlSync.getUrlState(payload.newState);
      const prevUrlState = changedObject.urlSync.getUrlState(payload.prevState);

      const searchParams = locationService.getSearch();
      const mappedUpdated: SceneObjectUrlValues = {};

      this.urlKeyMapper.rebuldIndex(this.sceneRoot);

      for (const [key, newUrlValue] of Object.entries(newUrlState)) {
        const uniqueKey = this.urlKeyMapper.getUniqueKey(key, changedObject);
        const currentUrlValue = searchParams.getAll(uniqueKey);

        if (!isUrlValueEqual(currentUrlValue, newUrlValue)) {
          mappedUpdated[uniqueKey] = newUrlValue;

          // Remember the initial state so we can go back to it
          if (!this.initialStates.has(uniqueKey) && prevUrlState[key] !== undefined) {
            this.initialStates.set(uniqueKey, prevUrlState[key]);
          }
        }
      }

      if (Object.keys(mappedUpdated).length > 0) {
        locationService.partial(mappedUpdated, true);
      }
    }
  };

  public cleanUp() {
    this.stateChangeSub.unsubscribe();
    this.locationListenerUnsub();
  }

  private syncSceneStateFromUrl(sceneObject: SceneObject, urlParams: URLSearchParams) {
    if (sceneObject.urlSync) {
      const urlState: SceneObjectUrlValues = {};
      const currentState = sceneObject.urlSync.getUrlState(sceneObject.state);

      for (const key of sceneObject.urlSync.getKeys()) {
        const uniqueKey = this.urlKeyMapper.getUniqueKey(key, sceneObject);
        const newValue = urlParams.getAll(uniqueKey);
        const currentValue = currentState[key];

        if (isUrlValueEqual(newValue, currentValue)) {
          continue;
        }

        if (newValue.length > 0) {
          if (Array.isArray(currentValue)) {
            urlState[key] = newValue;
          } else {
            urlState[key] = newValue[0];
          }

          // Remember the initial state so we can go back to it
          if (!this.initialStates.has(uniqueKey) && currentValue !== undefined) {
            this.initialStates.set(uniqueKey, currentValue);
          }
        } else {
          const initialValue = this.initialStates.get(uniqueKey);
          if (initialValue !== undefined) {
            urlState[key] = initialValue;
          }
        }
      }

      if (Object.keys(urlState).length > 0) {
        sceneObject.urlSync.updateFromUrl(urlState);
      }
    }

    forEachSceneObjectInState(sceneObject.state, (obj) => this.syncSceneStateFromUrl(obj, urlParams));
  }
}

interface SceneObjectWithDepth {
  sceneObject: SceneObject;
  depth: number;
}
class UniqueUrlKeyMapper {
  private index = new Map<string, SceneObjectWithDepth[]>();

  public getUniqueKey(key: string, obj: SceneObject) {
    const objectsWithKey = this.index.get(key);
    if (!objectsWithKey) {
      throw new Error("Cannot find any scene object that uses the key '" + key + "'");
    }

    const address = objectsWithKey.findIndex((o) => o.sceneObject === obj);
    if (address > 0) {
      return `${key}-${address + 1}`;
    }

    return key;
  }

  public rebuldIndex(root: SceneObject) {
    this.index.clear();
    this.buildIndex(root, 0);
  }

  private buildIndex(sceneObject: SceneObject, depth: number) {
    if (sceneObject.urlSync) {
      for (const key of sceneObject.urlSync.getKeys()) {
        const hit = this.index.get(key);
        if (hit) {
          hit.push({ sceneObject, depth });
          hit.sort((a, b) => a.depth - b.depth);
        } else {
          this.index.set(key, [{ sceneObject, depth }]);
        }
      }
    }

    forEachSceneObjectInState(sceneObject.state, (obj) => this.buildIndex(obj, depth + 1));
  }
}

export function isUrlValueEqual(currentUrlValue: string[], newUrlValue: SceneObjectUrlValue): boolean {
  if (currentUrlValue.length === 0 && newUrlValue == null) {
    return true;
  }

  if (!Array.isArray(newUrlValue) && currentUrlValue?.length === 1) {
    return newUrlValue === currentUrlValue[0];
  }

  if (newUrlValue?.length === 0 && currentUrlValue === null) {
    return true;
  }

  // We have two arrays, lets compare them
  return isEqual(currentUrlValue, newUrlValue);
}
