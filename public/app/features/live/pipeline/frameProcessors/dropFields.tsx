import { KeepFieldsFrameProcessorConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameProcessorItem } from '../types';

export const dropFields: PipelineFrameProcessorItem<KeepFieldsFrameProcessorConfig> = {
  kind: PipelineConfigKind.FrameProcessor,
  id: 'dropFields',
  description: 'Select the fields to drop',
  name: 'Drop fields',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
