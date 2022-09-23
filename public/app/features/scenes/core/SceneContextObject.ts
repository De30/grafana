import { SceneObjectBase } from './SceneObjectBase';
import { SceneTimeRange } from './SceneTimeRange';
import { SceneObjectState, StandardSceneObjectCtx } from './types';

export class SceneContextObject<TState extends SceneObjectState = {}> extends SceneObjectBase<TState> {
  ctx: StandardSceneObjectCtx = {
    timeRange: new SceneTimeRange({}),
    variables: [],
  };

  constructor(state: TState) {
    super(state);
    // TODO: Resolve state from persisted model
    // this.ctx = { timeRange: ..., variables: ... };
  }
}
