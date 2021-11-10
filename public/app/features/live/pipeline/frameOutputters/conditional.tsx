import { ConditionalFrameOutputterConfig, ManagedStreamFrameOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const conditional: PipelineFrameOutputterItem<ConditionalFrameOutputterConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'conditional',
  description: 'Conditionally output values',
  name: 'Managed stream',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
