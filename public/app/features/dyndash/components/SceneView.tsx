import React, { FC } from 'react';
import { SceneGrid } from './SceneGrid';
import { Scene, SceneItem, SceneItemList } from '../models';
import { Observable, Unsubscribable } from 'rxjs';
import { useObservable } from 'react-use';

export interface Props {
  model: Scene;
}

export const SceneView: FC<Props> = React.memo(({ model }) => {
  const panels = useObservable(runPanelStateHandler(model.panels), null);

  console.log('SceneView render');

  return (
    <>
      <div className="navbar">
        <div className="navbar-page-btn">{model.title}</div>
      </div>
      <div className="dashboard-content">{panels && <SceneGrid panels={panels} />}</div>
    </>
  );
});

interface SceneItemState {
  subscription: Unsubscribable;
  obs: Observable<SceneItem>;
  lastResult?: SceneItem;
}

function runPanelStateHandler(obs: Observable<SceneItemList>): Observable<SceneItem[]> {
  return new Observable(outer => {
    const state: SceneItemState[] = [];

    function emitCurrent() {
      const currentItems = state.filter(item => item.lastResult !== undefined).map(stateItem => stateItem.lastResult!);
      outer.next(currentItems);
    }

    const sub = obs.subscribe({
      next: list => {
        let inUpdate = true;

        for (let i = 0; i < list.length; i++) {
          const panelObs = list[i];

          if (!state[i]) {
            let newItem = { obs: panelObs } as any;
            newItem.subscription = panelObs.subscribe(scene => {
              newItem.lastResult = scene;

              if (!inUpdate) {
                emitCurrent();
              }
            });
            state[i] = newItem;
          }
        }

        emitCurrent();
        inUpdate = false;
      },
    });

    return () => {
      for (const item of state) {
        item.subscription.unsubscribe();
      }
      sub.unsubscribe();
    };
  });
}
