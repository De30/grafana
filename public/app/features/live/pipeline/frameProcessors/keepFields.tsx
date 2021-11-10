import { KeepFieldsFrameProcessorConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameProcessorItem } from '../types';

export const keepFields: PipelineFrameProcessorItem<KeepFieldsFrameProcessorConfig> = {
  kind: PipelineConfigKind.FrameProcessor,
  id: 'keepFields',
  description: 'Select the fields to keep',
  name: 'Keep fields',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
