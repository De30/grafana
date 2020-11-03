import React from 'react';
import { LoadingState, PanelData, TimeRange } from '@grafana/data';
import { Button } from '@grafana/ui';
import { Observable, of } from 'rxjs';
import { Scene, SceneItem, SceneItemList, VizPanel } from '../models';
import { v4 as newUuid } from 'uuid';

export function getDemoScene(name: string): Observable<Scene> {
  return of(getSceneContent());
}

function getSceneContent(): Scene {
  return {
    title: `Demo ${name}`,
    panels: new Observable<SceneItemList>(observer => {
      const panels: SceneItemList = [];

      const onButtonHit = () => {
        panels.push(getDemoPanel());
        observer.next(panels);
      };

      const onAddNested = () => {
        panels.push(
          of({
            ...getSceneContent(),
            type: 'scene',
            id: newUuid(),
            gridPos: { x: 12, y: 1, w: 12, h: 1 },
          })
        );
        observer.next(panels);
      };

      panels.push(getDemoPanel());
      panels.push(
        of({
          id: 'button3',
          type: 'component',
          gridPos: { x: 12, y: 1, w: 12, h: 1 },
          component: () => <Button onClick={onButtonHit}>Hit button</Button>,
        })
      );

      panels.push(
        of({
          id: 'button4',
          type: 'component',
          gridPos: { x: 12, y: 1, w: 12, h: 1 },
          component: () => <Button onClick={onAddNested}>Add nested scene</Button>,
        })
      );

      observer.next(panels);
    }),
  };
}

function getDemoPanel(): Observable<SceneItem> {
  return new Observable<SceneItem>(observer => {
    let counter = 1;

    const panel: VizPanel = {
      id: newUuid(),
      type: 'viz',
      title: 'Demo panel',
      vizId: 'bar-gauge',
      gridPos: { x: 0, y: 0, w: 12, h: 3 },
      data: of({
        state: LoadingState.Done,
        series: [],
        timeRange: {} as TimeRange,
      } as PanelData),
    };

    setInterval(() => {
      observer.next({
        ...panel,
        title: 'Demo panel ' + counter++,
      });
    }, 2000);

    observer.next(panel);
  });
}
