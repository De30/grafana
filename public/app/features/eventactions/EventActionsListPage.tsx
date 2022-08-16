import { css, cx } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, FilterInput, LinkButton, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import { Page } from 'app/core/components/Page/Page';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { contextSrv } from 'app/core/core';
import { StoreState, EventActionsDTO, AccessControlAction, EventActionStateFilter } from 'app/types';

import EventActionListItem from './components/EventActionsListItem';
import {
  changeQuery,
  fetchEventActions,
  deleteEventAction,
  updateEventAction,
  changeStateFilter,
} from './state/actions';

interface OwnProps { }

export type Props = OwnProps & ConnectedProps<typeof connector>;

function mapStateToProps(state: StoreState) {
  return {
    ...state.eventActions,
  };
}

const mapDispatchToProps = {
  changeQuery,
  fetchEventActions,
  deleteEventAction,
  updateEventAction,
  changeStateFilter,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export const EventActionsListPageUnconnected = ({
  eventActions,
  isLoading,
  query,
  eventActionStateFilter,
  changeQuery,
  fetchEventActions,
  deleteEventAction,
  updateEventAction,
  changeStateFilter,
}: Props): JSX.Element => {
  const styles = useStyles2(getStyles);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [currentEventAction, setCurrentEventAction] = useState<EventActionsDTO | null>(null);

  useEffect(() => {
    fetchEventActions({ withLoadingIndicator: true });
  }, [fetchEventActions]);

  const noEventActionsCreated =
    eventActions.length === 0 && eventActionStateFilter === EventActionStateFilter.All && !query;

  const onQueryChange = (value: string) => {
    changeQuery(value);
  };

  const onStateFilterChange = (value: EventActionStateFilter) => {
    changeStateFilter(value);
  };

  const onRemoveButtonClick = (eventAction: EventActionsDTO) => {
    setCurrentEventAction(eventAction);
    setIsRemoveModalOpen(true);
  };

  const onEventActionRemove = async () => {
    if (currentEventAction) {
      deleteEventAction(currentEventAction.id);
    }
    onRemoveModalClose();
  };

  const onRemoveModalClose = () => {
    setIsRemoveModalOpen(false);
    setCurrentEventAction(null);
  };

  const docsLink = (
    <a
      className="external-link"
      href="https://grafana.com/docs/grafana/latest/administration/eventactions/"
      target="_blank"
      rel="noopener noreferrer"
    >
      here.
    </a>
  );
  const subTitle = (
    <span>
      Event actions define workflows that are executed when events are produced. Find out more {docsLink}
    </span>
  );

  return (
    <Page navId="eventactions" subTitle={subTitle}>
      <Page.Contents>
        <Page.OldNavOnly>
          <div className={styles.pageHeader}>
            <h2>Event Actions</h2>
          </div>
        </Page.OldNavOnly>
        <div className="page-action-bar">
          <div className="gf-form gf-form--grow">
            <FilterInput
              placeholder="Search event action by name"
              value={query}
              onChange={onQueryChange}
              width={50}
            />
          </div>
          <RadioButtonGroup
            options={[
              { label: 'All', value: EventActionStateFilter.All },
              { label: 'Webhook', value: EventActionStateFilter.Webhook },
              { label: 'Code', value: EventActionStateFilter.Code },
            ]}
            onChange={onStateFilterChange}
            value={eventActionStateFilter}
            className={styles.filter}
          />
          {!noEventActionsCreated && contextSrv.hasPermission(AccessControlAction.EventActionsCreate) && (
            <LinkButton href="org/eventactions/create" variant="primary">
              Add event action
            </LinkButton>
          )}
        </div>
        {isLoading && <PageLoader />}
        {!isLoading && noEventActionsCreated && (
          <>
            <EmptyListCTA
              title="You haven't created any event actions yet."
              buttonIcon="brackets-curly"
              buttonLink="org/eventactions/create"
              buttonTitle="Add event action"
              buttonDisabled={!contextSrv.hasPermission(AccessControlAction.EventActionsCreate)}
              proTip=""
              proTipLink=""
              proTipLinkTitle=""
              proTipTarget="_blank"
            />
          </>
        )}

        {!isLoading && eventActions.length !== 0 && (
          <>
            <div className={cx(styles.table, 'admin-list-table')}>
              <table className="filter-table filter-table--hover">
                <thead>
                  <tr>
                    <th></th>
                    <th>Type</th>
                    <th>URL</th>
                    <th style={{ width: '34px' }} />
                  </tr>
                </thead>
                <tbody>
                  {eventActions.map((eventAction: EventActionsDTO) => (
                    <EventActionListItem
                      eventAction={eventAction}
                      key={eventAction.id}
                      onRemoveButtonClick={onRemoveButtonClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {currentEventAction && (
          <>
            <ConfirmModal
              isOpen={isRemoveModalOpen}
              body={`Are you sure you want to delete '${currentEventAction.name}'?`}
              confirmText="Delete"
              title="Delete event action"
              onConfirm={onEventActionRemove}
              onDismiss={onRemoveModalClose}
            />
          </>
        )}
      </Page.Contents>
    </Page>
  );
};

export const getStyles = (theme: GrafanaTheme2) => {
  return {
    table: css`
      margin-top: ${theme.spacing(3)};
    `,
    filter: css`
      margin: 0 ${theme.spacing(1)};
    `,
    row: css`
      display: flex;
      align-items: center;
      height: 100% !important;

      a {
        padding: ${theme.spacing(0.5)} 0 !important;
      }
    `,
    unitTooltip: css`
      display: flex;
      flex-direction: column;
    `,
    unitItem: css`
      cursor: pointer;
      padding: ${theme.spacing(0.5)} 0;
      margin-right: ${theme.spacing(1)};
    `,
    disabled: css`
      color: ${theme.colors.text.disabled};
    `,
    link: css`
      color: inherit;
      cursor: pointer;
      text-decoration: underline;
    `,
    pageHeader: css`
      display: flex;
      margin-bottom: ${theme.spacing(2)};
    `,
    filterDelimiter: css`
      flex-grow: 1;
    `,
  };
};

const EventActionsListPage = connector(EventActionsListPageUnconnected);
export default EventActionsListPage;
