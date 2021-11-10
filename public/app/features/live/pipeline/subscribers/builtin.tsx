import { BuildtinSubscriberConfig } from '../models.gen';
import { PipelineConfigKind, PipelineSubscriberItem } from '../types';

export const builtin: PipelineSubscriberItem<BuildtinSubscriberConfig> = {
  kind: PipelineConfigKind.Subscriber,
  id: 'builtin',
  description: 'Builtin subscriber',
  name: 'Builtin (default)',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
