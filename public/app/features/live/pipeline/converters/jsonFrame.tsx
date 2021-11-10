import { JsonAutoConverterConfig, JsonFrameConverterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineConverterItem } from '../types';

export const jsonFrame: PipelineConverterItem<JsonFrameConverterConfig> = {
  kind: PipelineConfigKind.Converter,
  id: 'jsonFrame',
  description: 'Frame is already json',
  name: 'json frame',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
