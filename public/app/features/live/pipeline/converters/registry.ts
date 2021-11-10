import { Registry } from '@grafana/data';
import { jsonAuto } from './jsonAuto';
import { PipelineConverterItem } from '../types';
import { jsonExact } from './jsonExact';
import { jsonFrame } from './jsonFrame';
import { influxAuto } from './influxAuto';

export const converters = new Registry<PipelineConverterItem>(() => {
  return [jsonAuto, jsonExact, influxAuto, jsonFrame];
});
