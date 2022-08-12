import { css } from '@emotion/css';
import React, { FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, ButtonGroup, Icon, Pagination, Tag, useStyles2 } from '@grafana/ui';
import { AlertingRule, CombinedRule, CombinedRuleNamespace } from 'app/types/unified-alerting';
import { GrafanaAlertState, PromAlertingRuleState, PromRuleType } from 'app/types/unified-alerting-dto';

import { isGrafanaRulesSource } from '../../utils/datasource';

import { AlertInstanceHoverPreview } from './AlertInstancesHoverPreview';

interface Props {
  namespaces: CombinedRuleNamespace[];
  expandAll: boolean;
}

function filterAlertStates(rules: Array<CombinedRule<AlertingRule>>, state: PromAlertingRuleState) {
  return rules.filter((rule) => rule.promRule?.type === PromRuleType.Alerting && rule.promRule?.state === state);
}

/**
 * We'll try the GitHub approach with this view and focus on a list of alert rules and instances
 *
 * @TODO
 *  RBAC
 */
export const RuleListListView: FC<Props> = ({ namespaces }) => {
  const styles = useStyles2(getStyles);

  const allRules = namespaces.flatMap((namespace) => namespace.groups.flatMap((group) => group.rules));
  const alertRules = allRules.filter((rule) => rule.promRule?.type === PromRuleType.Alerting) as Array<
    CombinedRule<AlertingRule>
  >;

  const GROUPED_BY_STATE = {
    [GrafanaAlertState.Alerting]: filterAlertStates(alertRules, PromAlertingRuleState.Firing),
    [GrafanaAlertState.Pending]: filterAlertStates(alertRules, PromAlertingRuleState.Pending),
    [GrafanaAlertState.Normal]: filterAlertStates(alertRules, PromAlertingRuleState.Inactive),
  };

  return (
    <>
      <div className={styles.list.wrapper}>
        <div className={styles.list.header}>
          <Stack direction="row" gap={2}>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="fire" size="sm" />
              <Shiny>
                <strong>{GROUPED_BY_STATE[GrafanaAlertState.Alerting].length} Firing</strong>
              </Shiny>
            </Stack>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="check-circle" size="sm" />
              {GROUPED_BY_STATE[GrafanaAlertState.Normal].length} Normal
            </Stack>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="circle" size="sm" />
              {GROUPED_BY_STATE[GrafanaAlertState.Pending].length} Pending
            </Stack>
            <Spacer />
            <Stack alignItems={'center'} gap={0.25}>
              Label
              <Icon name="angle-down" size="sm" />
            </Stack>
            <Stack alignItems={'center'} gap={0.25}>
              Type
              <Icon name="angle-down" size="sm" />
            </Stack>
            <Stack alignItems={'center'} gap={0.25}>
              Data Source
              <Icon name="angle-down" size="sm" />
            </Stack>
          </Stack>
        </div>
        <div className={styles.list.body.wrapper}>
          <Stack direction="column" gap={0}>
            {/* start row item */}
            {GROUPED_BY_STATE[GrafanaAlertState.Alerting].map((rule) => (
              <div key={rule.namespace.name + rule.group.name + rule.name} className={styles.list.body.row}>
                <Stack alignItems={'baseline'}>
                  {rule.promRule?.state === PromAlertingRuleState.Firing && <Icon name="fire" size="lg" />}
                  {rule.promRule?.state === PromAlertingRuleState.Inactive && <Icon name="check-circle" size="lg" />}
                  {rule.promRule?.state === PromAlertingRuleState.Pending && <Icon name="circle" size="lg" />}
                  <Stack direction="column" gap={0.25}>
                    {/* Name and tags */}
                    <Stack gap={0.5} alignItems={'center'}>
                      <Shiny>
                        <strong>{rule.name}</strong>
                      </Shiny>
                      <Stack alignItems={'center'} gap={0.5}>
                        {Object.entries(rule.labels).map(([name, value]) => (
                          <Tag key={name} name={`${name}=${value}`} />
                        ))}
                      </Stack>
                    </Stack>
                    <Stack alignItems={'center'} gap={1}>
                      <Stack gap={0.5} alignItems={'center'}>
                        <Icon name="folder" size="sm" />{' '}
                        <small>
                          {rule.namespace.name} / {rule.group.name}
                        </small>
                      </Stack>
                      {!isGrafanaRulesSource(rule.namespace.rulesSource) && (
                        <Stack gap={0.5} alignItems={'center'}>
                          <Icon name="database" size="sm" />
                          <small>{rule.namespace.rulesSource.name}</small>
                        </Stack>
                      )}
                      <Stack gap={0.5} alignItems={'center'}>
                        <Icon name="clock-nine" size="sm" /> <small>for 4 minutes</small>
                      </Stack>
                    </Stack>
                  </Stack>
                  <Spacer />
                  <Stack alignItems={'center'}>
                    {hasAlertInstances(rule.promRule) && (
                      <Stack gap={0.25} alignItems={'center'}>
                        <AlertInstanceHoverPreview instances={rule.promRule?.alerts ?? []}>
                          <Muted>
                            <Icon name="layer-group" /> <small>{rule.promRule?.alerts?.length}</small>
                          </Muted>
                        </AlertInstanceHoverPreview>
                      </Stack>
                    )}
                    <Stack gap={0.5} alignItems={'center'}>
                      <ButtonGroup>
                        <Button icon="eye" size="sm">
                          View
                        </Button>
                        <Button size="sm" icon="angle-down" />
                      </ButtonGroup>
                    </Stack>
                  </Stack>
                </Stack>
              </div>
            ))}
            {/* end row item */}
          </Stack>
        </div>
        <div className={styles.list.footer}></div>
      </div>
      <div className={styles.pagination}>
        <Pagination currentPage={1} numberOfPages={5} onNavigate={() => {}} />
      </div>
    </>
  );
};

function hasAlertInstances(rule?: AlertingRule) {
  if (!rule) {
    return false;
  }

  return (rule.alerts ?? []).length > 0;
}

const Spacer = () => (
  <div
    className={css`
      flex: 1;
    `}
  ></div>
);

const Muted: FC = ({ children }) => {
  const styles = useStyles2(getStyles);

  return (
    <span
      className={css`
        color: ${styles.muted};
      `}
    >
      {children}
    </span>
  );
};

const Shiny: FC = ({ children }) => {
  const styles = useStyles2(getStyles);

  return (
    <span
      className={css`
        color: ${styles.shiny};
      `}
    >
      {children}
    </span>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  list: {
    wrapper: css`
      border: 1px solid ${theme.colors.border.medium};
      background: ${theme.colors.background.primary};
      border-radius: ${theme.shape.borderRadius(1)};
    `,
    header: css`
      padding: ${theme.spacing(2)} ${theme.spacing(2)};
      border-bottom: solid 1px ${theme.colors.border.weak};
      background: ${theme.colors.background.secondary};
      margin-bottom: ${theme.spacing(1)};
    `,
    body: {
      wrapper: css``,
      row: css`
        padding: ${theme.spacing(1)} ${theme.spacing(2)};
        border-bottom: solid 1px ${theme.colors.border.weak};

        &:last-child {
          border-bottom: none;
        }
      `,
    },
    footer: css``,
  },
  pagination: css`
    margin: ${theme.spacing(1)} 0;
  `,
  muted: css`
    ${theme.colors.text.disabled};
  `,
  shiny: css`
    ${theme.colors.text.maxContrast};
  `,
});
