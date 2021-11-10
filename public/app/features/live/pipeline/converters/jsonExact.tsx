import { JsonExactConverterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineConverterItem } from '../types';

export const jsonExact: PipelineConverterItem<JsonExactConverterConfig> = {
  kind: PipelineConfigKind.Converter,
  id: 'jsonExact',
  description: 'Convert json to frame with explicit fields',
  name: 'From JSON (explicit)',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
