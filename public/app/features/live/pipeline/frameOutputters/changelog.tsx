import { ChangelogFrameOutputterConfig } from '../models.gen';
import { PipelineConfigKind, PipelineFrameOutputterItem } from '../types';

export const changelog: PipelineFrameOutputterItem<ChangelogFrameOutputterConfig> = {
  kind: PipelineConfigKind.FrameOutputter,
  id: 'changelog',
  description: 'Output changes to a log file',
  name: 'Changelog',
  builder: (builder, context) => {
    // builder.addCustomEditor
    console.log('ADD ITEMS!!');
  },
  //viewer: () => <div>JSON AUTO viewer</div>,
};
