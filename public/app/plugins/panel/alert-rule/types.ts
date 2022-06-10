import { SelectableValue } from '@grafana/data';
import { OptionsWithLegend } from '@grafana/schema';
import { RuleIdentifier } from 'app/types/unified-alerting';

export interface AlertRulePanelOptions extends OptionsWithLegend {
  alertRule: SelectedAlertRule;
}

export interface SelectedAlertRule extends SelectableValue<string> {
  ruleSource: string;
  ruleIdentifier: RuleIdentifier;
}
