import { Registry } from '@grafana/data';
import { jsonAuto } from './jsonAuto';
import { PipelineConverterItem, PipelineDataOutputterItem } from '../types';
import { jsonExact } from './jsonExact';
import { jsonFrame } from './jsonFrame';
import { influxAuto } from './influxAuto';

export const dataOutputters = new Registry<PipelineDataOutputterItem>(() => {
  return [jsonAuto, jsonExact, influxAuto, jsonFrame];
});
