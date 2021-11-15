import { Registry } from '@grafana/data';
import { PipelineFrameOutputterItem } from '../types';
import { changelog } from './changelog';
import { conditional } from './conditional';
import { loki } from './loki';
import { managedStream } from './managedStream';
import { multiple } from './multiple';
import { redirect } from './redirect';
import { remoteWrite } from './remoteWrite';
import { threshold } from './threshold';

export const frameOutputs = new Registry<PipelineFrameOutputterItem>(() => {
  return [managedStream, multiple, conditional, redirect, threshold, changelog, remoteWrite, loki];
});
