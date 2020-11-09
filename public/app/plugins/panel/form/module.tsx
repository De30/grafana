import { PanelPlugin } from '@grafana/data';
import { FormPanel } from './FormPanel';
import { FormSectionsEditor } from './FormSectionsEditor';
import { FormPanelOptions, TargetType } from './types';

export const plugin = new PanelPlugin<FormPanelOptions>(FormPanel)
  .useFieldConfig() // standard field configs
  .setPanelOptions(builder => {
    builder
      .addRadio({
        category: ['Request'],
        path: 'target',
        name: '', // Don't show the target
        settings: {
          options: [
            { value: TargetType.DS, label: 'Datasource' },
            { value: TargetType.URL, label: 'URL' },
          ],
        },
        defaultValue: TargetType.DS,
      })
      .addTextInput({
        category: ['Request'],
        path: 'url',
        name: 'URL',
        description: 'POST target URL',
        settings: {
          placeholder: 'http://host/path',
        },
        showIf: s => s.target === TargetType.URL,
      })
      .addTextInput({
        category: ['Request'],
        path: 'id',
        name: 'Form ID',
        description: 'Optionally add an id to the form request',
        settings: {
          placeholder: 'optional',
        },
      })
      .addCustomEditor({
        category: ['Sections'],
        id: 'sections',
        path: 'sections',
        name: '', // Hide the name header
        editor: FormSectionsEditor,
      })
      .addSliderInput({
        category: ['Sections'],
        path: 'labelWidth',
        name: 'Label width',
        defaultValue: 20,
        settings: {
          min: 5,
          max: 100,
          step: 1,
        },
      });
  });
