import { StandardEditorContext, StandardEditorProps } from '@grafana/data';
import { OptionsEditorItem, OptionsUIRegistryBuilder } from '@grafana/data/src/types/OptionsUIRegistryBuilder';

export interface PipelineEditorContext<TConfig> extends StandardEditorContext<TConfig> {
  // anything special?
}

export type PipelineConfigSupplier<TConfig> = (
  builder: PipelineConfigEditorBuilder<TConfig>,
  context: PipelineEditorContext<TConfig>
) => void;

export class PipelineConfigEditorBuilder<TConfig> extends OptionsUIRegistryBuilder<
  TConfig,
  StandardEditorProps,
  OptionsEditorItem<TConfig, any, any, any>
> {
  // nothing special for now
}
