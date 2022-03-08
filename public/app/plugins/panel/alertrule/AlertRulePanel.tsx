import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { PanelProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import { useCombinedRule } from 'app/features/alerting/unified/hooks/useCombinedRule';
import { alertRuleToQueries } from 'app/features/alerting/unified/utils/query';
import { RuleState } from 'app/features/alerting/unified/components/rules/RuleState';
import { RuleDetailsMatchingInstances } from 'app/features/alerting/unified/components/rules/RuleDetailsMatchingInstances';
import { AlertingQueryRunner } from 'app/features/alerting/unified/state/AlertingQueryRunner';
import { AlertQuery } from 'app/types/unified-alerting-dto';
import { AlertRulePanelOptions } from './types';
import { isAlertingRule } from '../../../features/alerting/unified/utils/rules';
import { AlertRule } from '../../../types';
import { AlertInstancesTable } from '../../../features/alerting/unified/components/rules/AlertInstancesTable';
import { Alert } from 'app/types/unified-alerting';

interface Props extends PanelProps<AlertRulePanelOptions> {}
const errorMessage = 'Could not find data source for rule';
export const AlertRulePanel: FC<Props> = ({ id, options, width, height }) => {
  const { alertRule } = options;
  const { loading, error, result: rule } = useCombinedRule(alertRule.ruleIdentifier, alertRule.ruleSource);
  const runner = useMemo(() => new AlertingQueryRunner(), []);
  const data = useObservable(runner.get());
  const queries2 = useMemo(() => alertRuleToQueries(rule), [rule]);
  const [queries, setQueries] = useState<AlertQuery[]>([]);

  const onRunQueries = useCallback(() => {
    if (queries.length > 0) {
      runner.run(queries);
    }
  }, [queries, runner]);

  useEffect(() => {
    setQueries(queries2);
  }, [queries2]);

  useEffect(() => {
    onRunQueries();
  }, [onRunQueries]);

  useEffect(() => {
    return () => runner.destroy();
  }, [runner]);

  const alerts = useMemo(
    (): Alert[] => (rule && isAlertingRule(rule.promRule) && rule.promRule.alerts?.length ? rule.promRule.alerts : []),
    [rule]
  );

  if (!rule) {
    return <span>Rule could not be found.</span>;
  }

  if (loading) {
    return <LoadingPlaceholder text="Loading rule..." />;
  }

  if (error) {
    return (
      <details>
        {error?.message ?? errorMessage}
        <br />
        {!!error?.stack && error.stack}
      </details>
    );
  }

  return (
    <div style={{ width, height }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <RuleState rule={rule} isCreating={false} isDeleting={false} />
        </div>
        <div>
          <div>Instances</div>
          <AlertInstancesTable instances={alerts} />
        </div>
      </div>
    </div>
  );
};
