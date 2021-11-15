import { Registry } from '@grafana/data';
import { PipelineDataOutputterItem } from '../types';
import { loki } from './loki';
import { redirect } from './redirect';

export const dataOutputters = new Registry<PipelineDataOutputterItem>(() => {
  return [loki, redirect];
});
