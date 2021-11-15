import { DataFrame, RegistryItemWithOptions, SelectableValue } from '@grafana/data';
import { PipelineConfigSupplier } from './builder';

export interface ChannelFrame {
  channel: string;
  frame: DataFrame;
}

export enum PipelineConfigKind {
  Subscriber = 'subscriber',
  Converter = 'converter',
  FrameProcessor = 'frameProcessor',
  FrameOutputter = 'frameOutputter',
  DataOutputter = 'dataOutputtter',
}

export interface PipelineContext {
  input: string;
  results: ChannelFrame[];
}

export interface PipelineConfigExample<TConfig = any> extends SelectableValue<TConfig> {}

// Base config for any configuration item
export interface PipelineConfigItem<TConfig> extends RegistryItemWithOptions<TConfig> {
  kind: PipelineConfigKind;

  /** Get examples for data */
  getExamples?: () => PipelineConfigExample[];

  /** Options builder */
  builder: PipelineConfigSupplier<TConfig>;

  /** Readonly view for the the configuration */
  display?: any;
}

export interface PipelineSubscriberItem<TConfig = any> extends PipelineConfigItem<TConfig> {
  kind: PipelineConfigKind.Subscriber;
}

export interface PipelineConverterItem<TConfig = any> extends PipelineConfigItem<TConfig> {
  kind: PipelineConfigKind.Converter;
}

export interface PipelineFrameProcessorItem<TConfig = any> extends PipelineConfigItem<TConfig> {
  kind: PipelineConfigKind.FrameProcessor;
}

export interface PipelineFrameOutputterItem<TConfig = any> extends PipelineConfigItem<TConfig> {
  kind: PipelineConfigKind.FrameOutputter;
}

export interface PipelineDataOutputterItem<TConfig = any> extends PipelineConfigItem<TConfig> {
  kind: PipelineConfigKind.DataOutputter;
}
