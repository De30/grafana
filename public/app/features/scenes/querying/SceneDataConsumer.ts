import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneDataState } from '../core/types';

import { SceneDataProvider } from './SceneDataProvider';

export class SceneDataConsumer extends SceneObjectBase<SceneDataState> {
  constructor(private producer: SceneDataProvider) {
    super({});
  }

  activate() {
    super.activate();
    this.producer.addConsumer(this);
  }

  deactivate(): void {
    super.deactivate();
    this.producer.removeConsumer(this);
  }
}
