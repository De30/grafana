import React from 'react';
import { StandardEditorContext, VariableSuggestionsScope } from '@grafana/data';
import { get as lodashGet, set as lodashSet, setWith, clone, cloneDeep } from 'lodash';
import { getDataLinksVariableSuggestions } from 'app/features/panel/panellinks/link_srv';
import { OptionPaneRenderProps } from './types';
import { updateDefaultFieldConfigValue } from './utils';
import { OptionsPaneItemDescriptor } from './OptionsPaneItemDescriptor';
import { OptionsPaneCategoryDescriptor } from './OptionsPaneCategoryDescriptor';

export function getVizualizationOptions(props: OptionPaneRenderProps): OptionsPaneCategoryDescriptor[] {
  const { plugin, panel, onPanelOptionsChanged, onFieldConfigsChange, data, dashboard } = props;
  const currentOptions = cloneDeep(panel.getOptions());
  const currentFieldConfig = panel.fieldConfig;
  const categoryIndex: Record<string, OptionsPaneCategoryDescriptor> = {};

  const context: StandardEditorContext<any> = {
    data: data?.series || [],
    replaceVariables: panel.replaceVariables,
    options: currentOptions,
    eventBus: dashboard.events,
    getSuggestions: (scope?: VariableSuggestionsScope) => {
      return data ? getDataLinksVariableSuggestions(data.series, scope) : [];
    },
  };

  const getOptionsPaneCategory = (categoryNames?: string[]): OptionsPaneCategoryDescriptor => {
    const categoryName = (categoryNames && categoryNames[0]) ?? `${plugin.meta.name}`;
    const category = categoryIndex[categoryName];

    if (category) {
      return category;
    }

    return (categoryIndex[categoryName] = new OptionsPaneCategoryDescriptor({
      title: categoryName,
      id: categoryName,
    }));
  };

  /**
   * Panel options
   */
  for (const pluginOption of plugin.optionEditors.list()) {
    if (pluginOption.showIf && !pluginOption.showIf(currentOptions, data?.series)) {
      continue;
    }

    const category = getOptionsPaneCategory(pluginOption.category);
    const Editor = pluginOption.editor;

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: pluginOption.name,
        description: pluginOption.description,
        render: function renderEditor() {
          const onChange = (value: any) => {
            const newOptions = lodashSet({ ...currentOptions }, pluginOption.path, value);
            const newOptionsImmutable = setWith(clone(currentOptions), pluginOption.path, value, clone);
            console.log('Mutable l1:', newOptions.debugOptions.l1 === currentOptions.debugOptions.l1);
            console.log('Mutable l2:', newOptions.debugOptions.l1.l2 === currentOptions.debugOptions.l1.l2);
            console.log('Immutable l2:', newOptionsImmutable.debugOptions.l1.l2 === currentOptions.debugOptions.l1.l2);
            console.log('Immutable l1:', newOptionsImmutable.debugOptions.l1 === currentOptions.debugOptions.l1);
            onPanelOptionsChanged(newOptions);
          };

          return (
            <Editor
              value={lodashGet(currentOptions, pluginOption.path)}
              onChange={onChange}
              item={pluginOption}
              context={context}
            />
          );
        },
      })
    );
  }

  /**
   * Field options
   */
  for (const fieldOption of plugin.fieldConfigRegistry.list()) {
    if (
      fieldOption.isCustom &&
      fieldOption.showIf &&
      !fieldOption.showIf(currentFieldConfig.defaults.custom, data?.series, panel.options)
    ) {
      continue;
    }

    if (fieldOption.hideFromDefaults) {
      continue;
    }

    const category = getOptionsPaneCategory(fieldOption.category);
    const Editor = fieldOption.editor;

    const defaults = currentFieldConfig.defaults;
    const value = fieldOption.isCustom
      ? defaults.custom
        ? lodashGet(defaults.custom, fieldOption.path)
        : undefined
      : lodashGet(defaults, fieldOption.path);

    if (fieldOption.getItemsCount) {
      category.props.itemsCount = fieldOption.getItemsCount(value);
    }

    category.addItem(
      new OptionsPaneItemDescriptor({
        title: fieldOption.name,
        description: fieldOption.description,
        render: function renderEditor() {
          const onChange = (v: any) => {
            onFieldConfigsChange(
              updateDefaultFieldConfigValue(currentFieldConfig, fieldOption.path, v, fieldOption.isCustom)
            );
          };

          return <Editor value={value} onChange={onChange} item={fieldOption} context={context} />;
        },
      })
    );
  }

  return Object.values(categoryIndex);
}
