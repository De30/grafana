import { DataFrame, FieldConfigEditorBuilder, PanelOptionsEditorBuilder, PanelPlugin } from '@grafana/data';
import { DebugPanel } from './DebugPanel';
import { DebugMode, DebugPanelFieldConfig, DebugPanelOptions } from './types';

export const plugin = new PanelPlugin<DebugPanelOptions, DebugPanelFieldConfig>(DebugPanel)
  .useFieldConfig({
    useCustomConfig: (builder) => {
      addNestedFieldConfigDebug(builder);
    },
  })
  .setPanelOptions((builder) => {
    builder
      .addRadio({
        path: 'mode',
        name: 'Mode',
        defaultValue: DebugMode.Options,
        settings: {
          options: [
            { label: 'Render', value: DebugMode.Render },
            { label: 'Events', value: DebugMode.Events },
            { label: 'Cursor', value: DebugMode.Cursor },
            { label: 'Options', value: DebugMode.Options },
          ],
        },
      })
      .addBooleanSwitch({
        path: 'counters.render',
        name: 'Render Count',
        defaultValue: true,
        showIf: ({ mode }) => mode === DebugMode.Render,
      })
      .addBooleanSwitch({
        path: 'counters.dataChanged',
        name: 'Data Changed Count',
        defaultValue: true,
        showIf: ({ mode }) => mode === DebugMode.Render,
      })
      .addBooleanSwitch({
        path: 'counters.schemaChanged',
        name: 'Schema Changed Count',
        defaultValue: true,
        showIf: ({ mode }) => mode === DebugMode.Render,
      });

    addNestedPanelOptionsDebug(builder);
  });

const addNestedPanelOptionsDebug = (builder: PanelOptionsEditorBuilder<DebugPanelOptions>) => {
  const showIf = ({ mode }: { mode: DebugMode }) => mode === DebugMode.Options;
  const category = ['Debug panel options'];
  builder.addTextInput({
    path: 'debugOptions.debugText',
    name: 'Level 0 text',
    showIf,
    category,
  });

  builder.addTextInput({
    path: 'debugOptions.l1.text',
    name: 'Level 1 text',
    category,
    showIf,
  });

  builder.addTextInput({
    path: 'debugOptions.l1.l2.text',
    name: 'Level 2 text',
    category,
    showIf,
  });
};

const addNestedFieldConfigDebug = (builder: FieldConfigEditorBuilder<DebugPanelFieldConfig, DebugPanelOptions>) => {
  const category = ['Debug field config'];
  const showIf = (_config: DebugPanelFieldConfig, _data: DataFrame[], o: DebugPanelOptions) => {
    return o?.mode === DebugMode.Options;
  };
  builder.addTextInput({
    path: 'debugText',
    name: 'Level 0 text',
    category,
    showIf,
  });
  builder.addTextInput({
    path: 'l1.text',
    name: 'Level 1 text',
    category,
    showIf,
  });

  builder.addTextInput({
    path: 'l1.l2.text',
    name: 'Level 2 text',
    category,
    showIf,
  });
};
