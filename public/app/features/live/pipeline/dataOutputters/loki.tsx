import { LokiOutputConfig } from '../models.gen';
import { PipelineConfigKind, PipelineDataOutputterItem } from '../types';

export const loki: PipelineDataOutputterItem<LokiOutputConfig> = {
  kind: PipelineConfigKind.DataOutputter,
  id: 'loki',
  description: 'write to loki',
  name: 'builtin',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
