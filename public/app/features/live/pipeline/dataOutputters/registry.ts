import { Registry } from '@grafana/data';
import { PipelineDataOutputterItem } from '../types';
import { builtin } from './buildin';
import { redirect } from './redirect';

export const dataOutputters = new Registry<PipelineDataOutputterItem>(() => {
  return [builtin, redirect];
});
