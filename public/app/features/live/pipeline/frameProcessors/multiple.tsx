import { MultipleFrameProcessorConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameProcessorItem } from '../types';

export const keepFields: PipelineFrameProcessorItem<MultipleFrameProcessorConfig> = {
  kind: PipelineConfigKind.FrameProcessor,
  id: 'multiple',
  description: 'multiple frame processors',
  name: 'Multiple',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
