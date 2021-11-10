import { BuiltinDataOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineDataOutputterItem } from '../types';

export const builtin: PipelineDataOutputterItem<BuiltinDataOutputterConfig> = {
  kind: PipelineConfigKind.DataOutputter,
  id: 'builtin',
  description: 'output to builtin?',
  name: 'builtin',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};

// { type: 'builtin', description: 'use builtin publish handler' },
// { type: 'redirect', description: 'redirect data processing to another channel rule' },
