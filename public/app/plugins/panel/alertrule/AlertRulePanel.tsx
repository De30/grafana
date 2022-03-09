import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';
import { css } from '@emotion/css';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { CustomScrollbar, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { RuleState } from 'app/features/alerting/unified/components/rules/RuleState';
import { AlertInstancesTable } from 'app/features/alerting/unified/components/rules/AlertInstancesTable';
import { AlertingQueryRunner } from 'app/features/alerting/unified/state/AlertingQueryRunner';
import { alertRuleToQueries } from 'app/features/alerting/unified/utils/query';
import { isAlertingRule } from 'app/features/alerting/unified/utils/rules';
import { useCombinedRule } from 'app/features/alerting/unified/hooks/useCombinedRule';
import { AlertQuery } from 'app/types/unified-alerting-dto';
import { AlertRulePanelOptions } from './types';
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
  const styles = useStyles2(getStyles);

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
    <CustomScrollbar autoHeightMin="100%" autoHeightMax="100%">
      <div style={{ width, height }}>
        <h4>{rule.name}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className={styles.ruleState}>
            <RuleState rule={rule} isCreating={false} isDeleting={false} />
          </div>
          <div>
            <AlertInstancesTable instances={alerts} isExpandable={false} />
          </div>
        </div>
      </div>
    </CustomScrollbar>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  ruleState: css`
    margin-right: ${theme.spacing(3)};
  `,
});
