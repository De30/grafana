// Attribution: Parts copied & inspired by
// https://github.com/influxdata/giraffe/blob/master/giraffe/src/utils/PlotEnv.ts
// MIT License Copyright (c) 2019 InfluxData

import { Margins, PlotConfig } from '../types';

export class PlotContext {
  private _config: PlotConfig | null = null;

  get config(): PlotConfig {
    return this._config!;
  }

  set config(config: PlotConfig) {
    this._config = config;
  }

  get margins(): Margins {
    return { left: 10, top: 10, bottom: 10, right: 10 };
  }

  get innerWidth(): number {
    const { width } = this.config;
    const { margins } = this;

    return width - margins.left - margins.right;
  }

  get innerHeight(): number {
    const { height } = this.config;
    const { margins } = this;

    return height - margins.top - margins.bottom;
  }
}
