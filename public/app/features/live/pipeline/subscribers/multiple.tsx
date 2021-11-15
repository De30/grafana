import { MultipleSubscriberConfig } from '../models.gen';
import { PipelineConfigKind, PipelineSubscriberItem } from '../types';

export const multiple: PipelineSubscriberItem<MultipleSubscriberConfig> = {
  kind: PipelineConfigKind.Subscriber,
  id: 'multiple',
  description: 'Multiple subscribers',
  name: 'Multiple',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
