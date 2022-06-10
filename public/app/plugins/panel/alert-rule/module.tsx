import React from 'react';

import { PanelPlugin } from '@grafana/data';

import { AlertRulePanel } from './AlertRulePanel';
import { AlertRulePicker } from './AlertRulePicker';
import { AlertRulePanelOptions } from './types';

export const plugin = new PanelPlugin<AlertRulePanelOptions>(AlertRulePanel).setPanelOptions((builder) => {
  builder.addCustomEditor({
    path: 'alertRule',
    name: 'Alert rule',
    id: 'alertRule',
    description: 'Choose an alert rule to visualize',
    defaultValue: { value: '', label: '' },
    editor: function RenderAlertRulePicker({ value, onChange }) {
      return <AlertRulePicker alertRule={value} onChange={onChange} />;
    },
    category: ['Alert rule'],
  });
});
