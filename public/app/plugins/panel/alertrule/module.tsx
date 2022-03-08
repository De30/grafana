import React from 'react';
import { PanelPlugin } from '@grafana/data';
import { AlertRulePanel } from './AlertRulePanel';
import { AlertRulePicker } from './AlerRulePicker';
import { AlertRulePanelOptions } from './types';
import { commonOptionsBuilder, OptionsWithLegend } from '@grafana/ui/src';

export const plugin = new PanelPlugin<OptionsWithLegend, AlertRulePanelOptions>(AlertRulePanel).setPanelOptions(
  (builder) => {
    commonOptionsBuilder.addLegendOptions(builder);
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
  }
);
