import { css } from '@emotion/css';
import React, { FC } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Button, Icon, Pagination, Tag, useStyles2 } from '@grafana/ui';
import { CombinedRuleNamespace } from 'app/types/unified-alerting';

interface Props {
  namespaces: CombinedRuleNamespace[];
  expandAll: boolean;
}

/**
 * We'll try the GitHub approach with this view and focus on a list of alert rules and instances
 *
 * @TODO
 *  RBAC
 */
export const RuleListListView: FC<Props> = ({ namespaces }) => {
  const styles = useStyles2(getStyles);

  return (
    <>
      <div className={styles.list.wrapper}>
        <div className={styles.list.header}>
          <Stack direction="row" gap={2}>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="fire" size="sm" />
              <Shiny>
                <strong>153 Firing</strong>
              </Shiny>
            </Stack>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="check-circle" size="sm" />
              2,923 Normal
            </Stack>
            <Stack alignItems={'center'} gap={0.5}>
              <Icon name="circle" size="sm" />
              47 Pending
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
            <div className={styles.list.body.row}>
              <Stack alignItems={'baseline'}>
                <Icon name="fire" size="lg" />
                <Stack direction="column" gap={0.25}>
                  {/* Name and tags */}
                  <Stack gap={0.5} alignItems={'center'}>
                    <Shiny>
                      <strong>CPU Usage</strong>
                    </Shiny>
                    <Stack alignItems={'center'} gap={0.5}>
                      <Tag name="team=operations" /> <Tag name="type=CPU" />
                    </Stack>
                  </Stack>
                  <Stack alignItems={'center'} gap={1}>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="folder" size="sm" /> <small>Server Monitoring / My Group</small>
                    </Stack>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="clock-nine" size="sm" /> <small>for 4 minutes</small>
                    </Stack>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="database" size="sm" />
                      <small>gdev-prometheus</small>
                    </Stack>
                  </Stack>
                </Stack>
                <Spacer />
                <Stack alignItems={'center'}>
                  <Stack gap={0.25} alignItems={'center'}>
                    <Muted>
                      <Icon name="layer-group" /> <small>{5}</small>
                    </Muted>
                  </Stack>
                  <Stack gap={0.5} alignItems={'center'}>
                    <Button icon="book" size="sm">
                      View runbook
                    </Button>
                    <Button icon="apps" size="sm">
                      View panel
                    </Button>
                    <Button icon="eye" size="sm">
                      Details
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </div>
            {/* end row item */}

            {/* start row item */}
            <div className={styles.list.body.row}>
              <Stack alignItems={'baseline'}>
                <Icon name="fire" size="lg" />
                <Stack direction="column" gap={0.25}>
                  {/* Name and tags */}
                  <Stack gap={0.5} alignItems={'center'}>
                    <Shiny>
                      <strong>CPU Usage</strong>
                    </Shiny>
                    <Stack alignItems={'center'} gap={0.5}>
                      <Tag name="team=operations" /> <Tag name="type=CPU" />
                    </Stack>
                  </Stack>
                  <Stack alignItems={'center'} gap={1}>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="folder" size="sm" /> <small>Server Monitoring / My Group</small>
                    </Stack>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="clock-nine" size="sm" /> <small>for 4 minutes</small>
                    </Stack>
                    <Stack gap={0.5} alignItems={'center'}>
                      <Icon name="database" size="sm" />
                      <small>gdev-prometheus</small>
                    </Stack>
                  </Stack>
                </Stack>
                <Spacer />
                <Stack alignItems={'center'}>
                  <Stack gap={0.25} alignItems={'center'}>
                    <Muted>
                      <Icon name="layer-group" /> <small>{5}</small>
                    </Muted>
                  </Stack>
                  <Stack gap={0.5} alignItems={'center'}>
                    <Button icon="book" size="sm">
                      View runbook
                    </Button>
                    <Button icon="apps" size="sm">
                      View panel
                    </Button>
                    <Button icon="eye" size="sm">
                      Details
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </div>
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
