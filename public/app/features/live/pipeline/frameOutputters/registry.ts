import { Registry } from '@grafana/data';
import { PipelineFrameOutputterItem } from '../types';
import { changelog } from './changelog';
import { conditional } from './conditional';
import { managedStream } from './managedStream';
import { redirect } from './redirect';
import { remoteWrite } from './remoteWrite';
import { threshold } from './threshold';

export const frameOutputs = new Registry<PipelineFrameOutputterItem>(() => {
  return [managedStream, conditional, redirect, threshold, changelog, remoteWrite];
});
