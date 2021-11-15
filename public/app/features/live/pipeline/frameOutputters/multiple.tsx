import { MultipleOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const multiple: PipelineFrameOutputterItem<MultipleOutputterConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'multiple',
  description: 'Write to multiple outputs',
  name: 'multiple',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
