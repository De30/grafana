import { ThresholdOutputConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const threshold: PipelineFrameOutputterItem<ThresholdOutputConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'threshold',
  description: 'Output threshold values',
  name: 'Threshold',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
