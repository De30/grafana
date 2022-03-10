import React, { FC, useMemo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2, PanelProps } from '@grafana/data';
import { CustomScrollbar, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { RuleState } from 'app/features/alerting/unified/components/rules/RuleState';
import { AlertInstancesTable } from 'app/features/alerting/unified/components/rules/AlertInstancesTable';
import { isAlertingRule } from 'app/features/alerting/unified/utils/rules';
import { useCombinedRule } from 'app/features/alerting/unified/hooks/useCombinedRule';
import { AlertRulePanelOptions } from './types';
import { Alert } from 'app/types/unified-alerting';

interface Props extends PanelProps<AlertRulePanelOptions> {}
const errorMessage = 'Could not find data source for rule';
export const AlertRulePanel: FC<Props> = ({ options, width, height }) => {
  const { alertRule } = options;
  const { loading, error, result: rule } = useCombinedRule(alertRule.ruleIdentifier, alertRule.ruleSource);
  const styles = useStyles2(getStyles);

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
