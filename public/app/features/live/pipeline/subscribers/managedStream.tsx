import { ManagedStreamSubscriberConfig } from '../models.gen';
import { PipelineConfigKind, PipelineSubscriberItem } from '../types';

export const managedStream: PipelineSubscriberItem<ManagedStreamSubscriberConfig> = {
  kind: PipelineConfigKind.Subscriber,
  id: 'managedStream',
  description: 'Return the full schema on subscribe',
  name: 'Managed stream',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
