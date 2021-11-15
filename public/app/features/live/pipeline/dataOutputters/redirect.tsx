import { RedirectDataOutputConfig } from '../models.gen';
import { PipelineConfigKind, PipelineDataOutputterItem } from '../types';

export const redirect: PipelineDataOutputterItem<RedirectDataOutputConfig> = {
  kind: PipelineConfigKind.DataOutputter,
  id: 'redirect',
  description: 'redirect to another channel',
  name: 'Redirect',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
