import {
  NumberFieldConfigSettings,
  SelectFieldConfigSettings,
  SliderFieldConfigSettings,
  StandardEditorContext,
  StandardEditorProps,
  standardEditorsRegistry,
  StringFieldConfigSettings,
} from '@grafana/data';
import { OptionEditorConfig } from '@grafana/data/src/types/options';
import { OptionsEditorItem, OptionsUIRegistryBuilder } from '@grafana/data/src/types/OptionsUIRegistryBuilder';

export interface PipelineOptionsEditorConfig<TConfig, TSettings = any, TValue = any>
  extends OptionEditorConfig<TConfig, TSettings, TValue> {}

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
  addNumberInput<TSettings>(
    config: PipelineOptionsEditorConfig<TConfig, TSettings & NumberFieldConfigSettings, number>
  ) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('number').editor as any,
    });
  }

  addSliderInput<TSettings>(
    config: PipelineOptionsEditorConfig<TConfig, TSettings & SliderFieldConfigSettings, number>
  ) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('slider').editor as any,
    });
  }

  addTextInput<TSettings>(config: PipelineOptionsEditorConfig<TConfig, TSettings & StringFieldConfigSettings, string>) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('text').editor as any,
    });
  }

  addSelect<TOption, TSettings extends SelectFieldConfigSettings<TOption>>(
    config: PipelineOptionsEditorConfig<TConfig, TSettings, TOption>
  ) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('select').editor as any,
    });
  }

  addMultiSelect<TOption, TSettings extends SelectFieldConfigSettings<TOption>>(
    config: PipelineOptionsEditorConfig<TConfig, TSettings, TOption>
  ) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('multi-select').editor as any,
    });
  }

  addRadio<TOption, TSettings extends SelectFieldConfigSettings<TOption>>(
    config: PipelineOptionsEditorConfig<TConfig, TSettings, TOption>
  ) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('radio').editor as any,
    });
  }

  addBooleanSwitch<TSettings = any>(config: PipelineOptionsEditorConfig<TConfig, TSettings, boolean>) {
    return this.addCustomEditor({
      ...config,
      id: config.path,
      editor: standardEditorsRegistry.get('boolean').editor as any,
    });
  }
}
