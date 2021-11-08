import { PipelineConfigKind, PipelineConverterItem } from '../types';

// This type must match the type defined in golang
export interface JsonAutoConfig {
  // hints?
}

export const jsonAuto: PipelineConverterItem<JsonAutoConfig> = {
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
