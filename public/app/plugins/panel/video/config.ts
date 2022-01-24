import { FieldColorModeId, FieldConfigProperty, SetFieldConfigOptionsArgs } from '@grafana/data';

import { PanelFieldConfig } from './models.gen';

export function getVideoFieldConfig(cfg: PanelFieldConfig): SetFieldConfigOptionsArgs<PanelFieldConfig> {
  return {
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
          bySeriesSupport: true,
          preferThresholdsMode: false,
        },
        defaultValue: {
          mode: FieldColorModeId.PaletteClassic,
        },
      },
    },

    useCustomConfig: (builder) => {},
  };
}
