import { JsonAutoConverterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineConverterItem } from '../types';

export const jsonAuto: PipelineConverterItem<JsonAutoConverterConfig> = {
  kind: PipelineConfigKind.Converter,
  id: 'jsonAuto',
  description: 'Convert json to frame automatically',
  name: 'From JSON (automatic)',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
