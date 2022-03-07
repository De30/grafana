import React, { FC, useEffect, useState } from 'react';
import { Select } from '@grafana/ui';
import { useDispatch } from 'react-redux';
import { fetchAllPromAndRulerRulesAction } from 'app/features/alerting/unified/state/actions';
import { useCombinedRuleNamespaces } from 'app/features/alerting/unified/hooks/useCombinedRuleNamespaces';
import { SelectableValue } from '@grafana/data';

interface Props {
  value: SelectableValue;
  onChange: (value: SelectableValue) => void;
}

export const AlertRulePicker: FC<Props> = ({ value, onChange }) => {
  const dispatch = useDispatch();
  const [alertRules, setAlertRules] = useState<SelectableValue[]>([]);

  useEffect(() => {
    dispatch(fetchAllPromAndRulerRulesAction());
  }, [dispatch]);

  const combinedNamespaces = useCombinedRuleNamespaces();

  useEffect(() => {
    const rulesAsSelectable = combinedNamespaces.flatMap((namespace) => {
      return namespace.groups.flatMap((group) => {
        return group.rules.map((rule) => {
          return {
            value: rule.name,
            label: rule.name,
          };
        });
      });
    });
    setAlertRules(rulesAsSelectable);
  }, [combinedNamespaces]);

  return <Select options={alertRules} onChange={onChange} value={alertRules.find((ar) => ar.value === value.value)} />;
};
