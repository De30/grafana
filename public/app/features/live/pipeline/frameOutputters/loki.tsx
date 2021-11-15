import { LokiOutputConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const loki: PipelineFrameOutputterItem<LokiOutputConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'loki',
  description: 'Write to loki',
  name: 'loki',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
