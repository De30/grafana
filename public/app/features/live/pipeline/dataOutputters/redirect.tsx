import { RedirectDataOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineDataOutputterItem } from '../types';

export const redirect: PipelineDataOutputterItem<RedirectDataOutputterConfig> = {
  kind: PipelineConfigKind.DataOutputter,
  id: 'redirect',
  description: 'redirect to another channel',
  name: 'builtin',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
