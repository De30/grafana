import React from 'react';

import { Button } from '@grafana/ui';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { sceneGraph } from '../core/sceneGraph';
import { SceneComponentProps, SceneLayoutChildState, SceneObjectUrlValues } from '../core/types';
import { SceneObjectUrlSyncConfig } from '../services/SceneObjectUrlSyncConfig';

export interface BigTextState extends SceneLayoutChildState {
  text: string;
  fontSize: number;
}

export class BigText extends SceneObjectBase<BigTextState> {
  public static Component = BigTextRenderer;

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['fontSize'] });
  public getUrlState(state: BigTextState) {
    return { fontSize: state.fontSize.toString() };
  }

  public updateFromUrl(values: SceneObjectUrlValues) {
    if (values.fontSize && !Array.isArray(values.fontSize)) {
      this.setState({ fontSize: parseInt(values.fontSize, 10) });
    }
  }

  public onIncrement = () => {
    this.setState({ fontSize: this.state.fontSize + 1 });
  };
}

function BigTextRenderer({ model }: SceneComponentProps<BigText>) {
  const { text, fontSize } = model.useState();

  return (
    <div style={{ fontSize: fontSize }}>
      <div>{text}</div>
      <Button onClick={model.onIncrement}>Increment font size</Button>
    </div>
  );
}

//
//
//
//
//
//

// public activate() {
//     super.activate();
//
//     this._subs.add(sceneGraph.getTimeRange(this).subscribeToState({
//       next: (timeRange) => {
//         this.setState({ text: timeRange.from.toString() });
//       },
//     }));
//   }

// public onIncrement = () => {
//     this.setState({ fontSize: this.state.fontSize + 1 });
//   };

// protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['fontSize'] });
// public getUrlState(state: BigTextState) {
//   return { fontSize: state.fontSize.toString() };
// }

// public updateFromUrl(values: SceneObjectUrlValues) {
//   if (values.fontSize && !Array.isArray(values.fontSize)) {
//     this.setState({ fontSize: parseInt(values.fontSize, 10) });
//   }
// }
