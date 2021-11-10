import { Registry } from '@grafana/data';
import { PipelineFrameProcessorItem } from '../types';
import { dropFields } from './dropFields';
import { keepFields } from './keepFields';

export const frameProcessors = new Registry<PipelineFrameProcessorItem>(() => {
  return [keepFields, dropFields];
});
