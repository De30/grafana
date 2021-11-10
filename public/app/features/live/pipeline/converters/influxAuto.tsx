import { InfluxAutoConverterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineConverterItem } from '../types';

export const influxAuto: PipelineConverterItem<InfluxAutoConverterConfig> = {
  kind: PipelineConfigKind.Converter,
  id: 'influxAuto',
  description: 'Convert influx line protocol',
  name: 'From influx line protocol',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
