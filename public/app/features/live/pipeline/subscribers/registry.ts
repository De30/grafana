import { Registry } from '@grafana/data';
import { PipelineSubscriberItem } from '../types';
import { builtin } from './builtin';
import { managedStream } from './managedStream';

export const subscribers = new Registry<PipelineSubscriberItem>(() => {
  return [managedStream, builtin];
});
