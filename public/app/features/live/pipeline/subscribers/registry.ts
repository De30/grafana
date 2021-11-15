import { Registry } from '@grafana/data';
import { PipelineSubscriberItem } from '../types';
import { multiple } from './multiple';

export const subscribers = new Registry<PipelineSubscriberItem>(() => {
  return [multiple];
});
