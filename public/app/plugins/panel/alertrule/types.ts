import { SelectableValue } from '@grafana/data';
import { RuleIdentifier } from 'app/types/unified-alerting';
import { OptionsWithLegend } from '@grafana/schema/src';

export interface AlertRulePanelOptions extends OptionsWithLegend {
  alertRule: SelectedAlertRule;
}

export interface SelectedAlertRule extends SelectableValue<string> {
  ruleSource: string;
  ruleIdentifier: RuleIdentifier;
}
