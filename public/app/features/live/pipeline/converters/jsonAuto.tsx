import { AutoJsonConverterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineConverterItem } from '../types';

export const jsonAuto: PipelineConverterItem<AutoJsonConverterConfig> = {
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
