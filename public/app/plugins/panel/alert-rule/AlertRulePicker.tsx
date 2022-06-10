import React, { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Select } from '@grafana/ui';
import { useCombinedRuleNamespaces } from 'app/features/alerting/unified/hooks/useCombinedRuleNamespaces';
import { fetchAllPromAndRulerRulesAction } from 'app/features/alerting/unified/state/actions';
import { getRulesSourceName } from 'app/features/alerting/unified/utils/datasource';
import * as ruleId from 'app/features/alerting/unified/utils/rule-id';
import { isAlertingRule } from 'app/features/alerting/unified/utils/rules';

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
        return group.rules
          .filter((rule) => isAlertingRule(rule.promRule))
          .map((rule) => {
            const sourceName = getRulesSourceName(rule.namespace.rulesSource);
            const identifier = ruleId.fromCombinedRule(sourceName, rule);
            return {
              value: rule.name,
              label: rule.name,
              ruleSource: sourceName,
              ruleIdentifier: identifier,
            };
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
