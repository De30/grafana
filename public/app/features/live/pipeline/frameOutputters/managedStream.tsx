import { ManagedStreamFrameOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const managedStream: PipelineFrameOutputterItem<ManagedStreamFrameOutputterConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'managedStream',
  description: 'Send schema when it changes',
  name: 'Managed stream',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
