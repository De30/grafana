import React, { FC, useEffect, useState } from 'react';
import { Select } from '@grafana/ui';
import { useDispatch } from 'react-redux';
import { fetchAllPromAndRulerRulesAction } from 'app/features/alerting/unified/state/actions';
import { useCombinedRuleNamespaces } from 'app/features/alerting/unified/hooks/useCombinedRuleNamespaces';
import { GRAFANA_RULES_SOURCE_NAME } from 'app/features/alerting/unified/utils/datasource';
import {
  isAlertingRulerRule,
  isGrafanaRulerRule,
  isRecordingRulerRule,
} from '../../../features/alerting/unified/utils/rules';
import { SelectedAlertRule } from './types';

interface Props {
  alertRule: SelectedAlertRule;
  onChange: (alertRule: SelectedAlertRule) => void;
}

export const AlertRulePicker: FC<Props> = ({ alertRule, onChange }) => {
  const dispatch = useDispatch();
  const [alertRules, setAlertRules] = useState<SelectedAlertRule[]>([]);

  useEffect(() => {
    dispatch(fetchAllPromAndRulerRulesAction());
  }, [dispatch]);

  const combinedNamespaces = useCombinedRuleNamespaces();

  useEffect(() => {
    const rulesAsSelectable = combinedNamespaces.flatMap((namespace) => {
      return namespace.groups.flatMap((group) => {
        return group.rules.map((rule) => {
          if (isGrafanaRulerRule(rule.rulerRule)) {
            return {
              value: rule.rulerRule.grafana_alert.uid,
              label: rule.name,
              ruleSource: GRAFANA_RULES_SOURCE_NAME,
              ruleIdentifier: { uid: rule.rulerRule.grafana_alert.uid },
            };
          } else if (isAlertingRulerRule(rule.rulerRule)) {
            return {};
          } else if (isRecordingRulerRule(rule.rulerRule)) {
            return {};
          }
          return {};
        });
      });
    });
    setAlertRules(rulesAsSelectable);
  }, [combinedNamespaces]);

  return (
    <Select
      options={alertRules}
      onChange={(value) => onChange(alertRules.find((ar) => ar.value === value.value)!)}
      value={alertRules.find((ar) => ar.value === alertRule.value)}
    />
  );
};
