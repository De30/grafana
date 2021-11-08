import { Registry } from '@grafana/data';
import {
  PipelineConverterItem,
  PipelineDataOutputterItem,
  PipelineFrameOutputterItem,
  PipelineFrameProcessorItem,
} from './types';

export const converters = new Registry<PipelineConverterItem>(() => {
  return [
    //   ...getFieldPredicateMatchers(), // Predicates
    //   ...getFieldTypeMatchers(), // by type
  ];
});

export const frameProcessors = new Registry<PipelineFrameProcessorItem>(() => {
  return [
    //   ...getFieldPredicateMatchers(), // Predicates
    //   ...getFieldTypeMatchers(), // by type
  ];
});

export const frameOutputs = new Registry<PipelineFrameOutputterItem>(() => {
  return [
    //   ...getFieldPredicateMatchers(), // Predicates
    //   ...getFieldTypeMatchers(), // by type
  ];
});

export const dataOutputs = new Registry<PipelineDataOutputterItem>(() => {
  return [
    //   ...getFieldPredicateMatchers(), // Predicates
    //   ...getFieldTypeMatchers(), // by type
  ];
});
