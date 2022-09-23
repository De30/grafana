import { TimeRange, UrlQueryMap } from '@grafana/data';
import { SceneObjectBase } from './SceneObjectBase';
import { SceneObjectWithUrlSync, SceneTimeRangeState } from './types';

/**
 * This class needs to be extended by any scene object that can provide time range
 */
export class SceneTimeRangeObject<TState extends SceneTimeRangeState = SceneTimeRangeState>
  extends SceneObjectBase<TState>
  implements SceneObjectWithUrlSync
{
  onTimeRangeChange = (range: TimeRange) => {
    this.setState({ range });
  };

  onRefresh = () => {
    // TODO re-eval time range
    this.setState({ ...this.state });
  };

  onIntervalChanged = (_: string) => {};

  /** These url sync functions are only placeholders for something more sophisticated  */
  getUrlState() {
    if (this.state.range) {
      return null;
    }
    return {
      from: this.state.range!.raw.from,
      to: this.state.range!.raw.to,
    } as any;
  }

  updateFromUrl(values: UrlQueryMap) {
    // TODO
  }

  getTimeRange(): SceneTimeRangeObject {
    return this;
  }
}
