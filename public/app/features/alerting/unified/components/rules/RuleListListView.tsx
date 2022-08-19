import { css } from '@emotion/css';
import React, { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, ButtonGroup, Icon, Input, Pagination, RadioButtonGroup, Tag, useStyles2 } from '@grafana/ui';
import { AlertingRule, CombinedRule, CombinedRuleNamespace } from 'app/types/unified-alerting';
import { PromAlertingRuleState } from 'app/types/unified-alerting-dto';

import { isGrafanaRulesSource } from '../../utils/datasource';
import { createViewLink } from '../../utils/misc';
import { isAlertingRule } from '../../utils/rules';

import { AlertInstanceHoverPreview } from './AlertInstancesHoverPreview';

interface Props {
  namespaces: CombinedRuleNamespace[];
  expandAll: boolean;
}

interface Filters {
  state: PromAlertingRuleState;
  type: string | null;
  dataSource: string | null;
  labels: string | null;
}

const ViewOptions: SelectableValue[] = [
  {
    icon: 'list-ul',
    label: 'List',
    value: 'list',
  },
  {
    icon: 'folder',
    label: 'Grouped',
    value: 'grouped',
  },
];

function filterAlertStates(rules: Array<CombinedRule<AlertingRule>>, state: PromAlertingRuleState) {
  return rules.filter((rule) => rule.promRule?.state === state);
}

/**
 * We'll try the GitHub approach with this view and focus on a list of alert rules and instances
 *
 * @TODO
 *  RBAC
 */
export const RuleListListView: FC<Props> = ({ namespaces }) => {
  const styles = useStyles2(getStyles);
  const { search, pathname } = useLocation();

  // filters
  const searchParams = new URLSearchParams(search);

  const FILTERS: Filters = {
    state: (searchParams.get('alertState') as PromAlertingRuleState) ?? PromAlertingRuleState.Firing,
    type: searchParams.get('ruleType'),
    dataSource: searchParams.get('dataSource'),
    labels: searchParams.get('queryString'),
  };

  /**
   * we'll combine all of the rules from all the groups of all namespaces
   *
   *  my-prometheus-datasource               my-other-datasource
   * ╔════════════════════════════════════╗ ╔═════════════════════╗
   * ║ ┌─────────────┐   ┌─────────────┐  ║ ║ ┌─────────────┐     ║
   * ║ │ Namespace 1 │   │ Namespace 2 │  ║ ║ │ Namespace 1 │     ║
   * ║ └─┬───────────┘   └─┬───────────┘  ║ ║ └─┬───────────┘     ║
   * ║   │  ┌─────────┐    │  ┌─────────┐ ║ ║   │  ┌─────────┐    ║
   * ║   ├──│ Group 1 │    ├──│ Group 1 │ ║ ║   ├──│ Group 1 │    ║
   * ║   │  └┬────────┤    │  └┬────────┤ ║ ║   │  └┬────────┤    ║
   * ║   │   │ Rule 1 │    │   │ Rule 1 │ ║ ║   │   │ Rule 1 │    ║
   * ║   │   │ Rule 2 │    │   │ Rule 2 │ ║ ║   │   │ Rule 2 │    ║
   * ║   │   │ Rule 3 │    │   │ Rule 3 │ ║ ║   │   │ Rule 3 │    ║
   * ║   │   └────────┘    │   └────────┘ ║ ║   │   └────────┘    ║
   * ║   │  ┌─────────┐    │  ┌─────────┐ ║ ║   │  ┌─────────┐    ║
   * ║   └──│ Group 2 │    └──│ Group 2 │ ║ ║   └──│ Group 2 │    ║
   * ║      └┬────────┤       └┬────────┤ ║ ║      └┬────────┤    ║
   * ║       │ Rule 1 │        │ Rule 1 │ ║ ║       │ Rule 1 │    ║
   * ║       │ Rule 2 │        │ Rule 2 │ ║ ║       │ Rule 2 │    ║
   * ║       │ Rule 3 │        │ Rule 3 │ ║ ║       │ Rule 3 │    ║
   * ║       └────────┘        └────────┘ ║ ║       └────────┘    ║
   * ╚════════════════════════════════════╝ ╚═════════════════════╝
   */
  const allRules = namespaces.flatMap((namespace) => namespace.groups.flatMap((group) => group.rules));

  const alertRules = allRules.filter((rule): rule is CombinedRule<AlertingRule> => isAlertingRule(rule.promRule));

  // grouping
  const GROUPED_BY_STATE = {
    [PromAlertingRuleState.Firing]: filterAlertStates(alertRules, PromAlertingRuleState.Firing),
    [PromAlertingRuleState.Pending]: filterAlertStates(alertRules, PromAlertingRuleState.Pending),
    [PromAlertingRuleState.Inactive]: filterAlertStates(alertRules, PromAlertingRuleState.Inactive),
  };

  return (
    <>
      <Stack direction="column" gap={2}>
        <Stack direction="row" gap={1}>
          <Input
            name="search-input"
            placeholder={createPlaceholder(FILTERS)}
            prefix={<Icon name="search" />}
            loading={false}
            className={styles.flexGrowAndShrink}
          />
          <RadioButtonGroup options={ViewOptions} value={'list'} onChange={() => {}} />
          <Button variant="primary">New rule</Button>
        </Stack>
        <div className={styles.list.wrapper}>
          <div className={styles.list.header}>
            <Stack direction="row" gap={2}>
              <Stack alignItems={'center'} gap={0.5}>
                <Link to={setFilter(pathname, searchParams, 'alertState', 'firing')}>
                  <Icon name="fire" size="sm" />{' '}
                  <Shiny>
                    <strong>{GROUPED_BY_STATE[PromAlertingRuleState.Firing].length} Firing</strong>
                  </Shiny>
                </Link>
              </Stack>
              <Stack alignItems={'center'} gap={0.5}>
                <Link to={setFilter(pathname, searchParams, 'alertState', 'inactive')}>
                  <Icon name="check-circle" size="sm" /> {GROUPED_BY_STATE[PromAlertingRuleState.Inactive].length}{' '}
                  Normal
                </Link>
              </Stack>
              <Stack alignItems={'center'} gap={0.5}>
                <Link to={setFilter(pathname, searchParams, 'alertState', 'pending')}>
                  <Icon name="circle" size="sm" /> {GROUPED_BY_STATE[PromAlertingRuleState.Pending].length} Pending
                </Link>
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
              {(GROUPED_BY_STATE[FILTERS.state] ?? []).map((rule) => (
                <div key={rule.namespace.name + rule.group.name + rule.name} className={styles.list.body.row}>
                  <Stack alignItems={'baseline'}>
                    {/* // TODO make this a separate icon component probably */}
                    {rule.promRule?.state === PromAlertingRuleState.Firing && <Icon name="fire" />}
                    {rule.promRule?.state === PromAlertingRuleState.Inactive && <Icon name="check-circle" />}
                    {rule.promRule?.state === PromAlertingRuleState.Pending && <Icon name="circle" />}
                    <Stack direction="column" gap={0.25}>
                      {/* Name and tags */}

                      <Link to={createViewLink(rule.namespace.rulesSource, rule, '/alerting/list')}>
                        <Shiny>
                          <strong>{rule.name}</strong>
                        </Shiny>
                      </Link>

                      <Stack alignItems={'center'} gap={1}>
                        {!isGrafanaRulesSource(rule.namespace.rulesSource) && (
                          <Stack gap={0.5} alignItems={'center'}>
                            <img
                              src="public/app/plugins/datasource/prometheus/img/prometheus_logo.svg"
                              width={14}
                              height={14}
                            />
                            <small>{rule.namespace.rulesSource.name}</small>
                          </Stack>
                        )}
                        {isGrafanaRulesSource(rule.namespace.rulesSource) && (
                          <Stack gap={0.5} alignItems={'center'}>
                            <Icon name="grafana" size="sm" />
                            <small>Grafana Managed</small>
                          </Stack>
                        )}
                        <Stack gap={0.5} alignItems={'center'}>
                          <Icon name="folder" size="sm" />{' '}
                          <small>
                            {rule.namespace.name} / {rule.group.name}
                          </small>
                        </Stack>
                      </Stack>
                      <Stack alignItems={'center'} gap={0.5}>
                        {Object.entries(rule.labels).map(([name, value]) => (
                          <Tag key={name} name={`${name}=${value}`} />
                        ))}
                      </Stack>
                    </Stack>
                    <Spacer />
                    <Stack alignItems={'center'}>
                      <Stack gap={0.5} alignItems={'center'}>
                        <Icon name="clock-nine" size="sm" /> <small>for 4 minutes</small>
                      </Stack>
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
                          <Button icon="pen" size="sm" variant="secondary">
                            Edit
                          </Button>
                          <Button size="sm" icon="angle-down" variant="secondary" />
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
      </Stack>
    </>
  );
};

function createPlaceholder(filters: Filters) {
  return Object.entries(filters)
    .filter(([_, value]) => value !== null)
    .map(([key, value]) => key + ':' + value)
    .join(' ');
}

// TODO do not use mutation here, could be bad
function setFilter(pathname: string, search: URLSearchParams, key: string, value: string): string {
  search.set(key, value);
  return pathname + '?' + search.toString();
}

function hasAlertInstances(rule?: AlertingRule) {
  if (!rule) {
    return false;
  }

  return (rule.alerts ?? []).length > 0;
}

// TODO move this util components and functions
const Spacer = () => (
  <div
    className={css`
      flex: 1;
    `}
  />
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
  flexGrowAndShrink: css`
    flex: 1;
  `,
});
