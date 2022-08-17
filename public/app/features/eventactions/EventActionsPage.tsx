import { css } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, CodeEditor, ConfirmModal, IconButton, useStyles2, Form, Field, FieldSet, RadioButtonGroup, Input, InputControl } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/core';
import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { EventActionsDTO, StoreState, AccessControlAction, EventActionStateFilter } from 'app/types';

import {
  deleteEventAction,
  loadEventAction,
  updateEventAction,
} from './state/actionsEventActionsPage';

const typeOptions = [
  { label: 'Webhook', value: EventActionStateFilter.Webhook },
  { label: 'Code', value: EventActionStateFilter.Code },
];

const languageOptions = [
  { label: 'Javascript', value: 'javascript' },
  { label: 'Go', value: 'go' },
  { label: 'Python 3', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
];

interface OwnProps extends GrafanaRouteComponentProps<{ id: string }> {
  eventAction?: EventActionsDTO;
  isLoading: boolean;
}

function mapStateToProps(state: StoreState) {
  return {
    eventAction: state.eventActionProfile.eventAction,
    isLoading: state.eventActionProfile.isLoading,
  };
}

const mapDispatchToProps = {
  deleteEventAction,
  loadEventAction,
  updateEventAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export const EventActionsPageUnconnected = ({
  match,
  eventAction,
  isLoading,
  deleteEventAction,
  loadEventAction,
  updateEventAction,
}: Props): JSX.Element => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentEventAction, setCurrentEventAction] = useState<EventActionsDTO>(eventAction);
  const styles = useStyles2(getStyles);
  const eventActionId = parseInt(match.params.id, 10);

  const onSubmit = useCallback(
    async (data: EventActionsDTO) => {
      data.id = eventActionId;
      try {
        await updateEventAction(data);
      } catch (e) {
        console.error(e);
      }
    },
    [updateEventAction, eventActionId]
  );

  useEffect(() => {
    loadEventAction(eventActionId);
  }, [loadEventAction, eventActionId]);

  const showDeleteEventActionsModal = (show: boolean) => () => {
    setIsDeleteModalOpen(show);
  };

  const handleEventActionsDelete = () => {
    deleteEventAction(eventAction.id);
  };

  return (
    <Page navId="eventactions">
      <Page.Contents isLoading={isLoading}>
        <div className={styles.headerContainer}>
          <a href="org/eventactions">
            <IconButton
              size="xxl"
              variant="secondary"
              name="arrow-left"
              className={styles.returnButton}
              aria-label="Back to event actions list"
            />
          </a>
          <h3>{eventAction.name}</h3>

          <div className={styles.buttonRow}>
            <Button
              type={'button'}
              variant="destructive"
              onClick={showDeleteEventActionsModal(true)}
              disabled={!contextSrv.hasPermission(AccessControlAction.EventActionsDelete)}
            >
              Delete event action
            </Button>
          </div>
        </div>
        <div className={styles.pageBody}>
          <Form onSubmit={onSubmit} validateOn="onSubmit" defaultValues={{ ...eventAction }}>
            {({ register, control, errors }) => {
              if (!isLoading && currentEventAction.id !== eventActionId) {
                setCurrentEventAction(eventAction);
              }
              return (
                <>
                  <FieldSet>
                    <Field
                      label="Name"
                      required
                      invalid={!!errors.name}
                      error={errors.name ? 'Name is required' : undefined}
                    >
                      <Input id="name-input" {...register("name")} autoFocus />
                    </Field>
                    <Field
                      label="Description"
                    >
                      <InputControl
                        name="description"
                        control={control}
                        render={({ field: { onBlur, onChange, ...field } }) => <AutoSizer style={{ height: '100px', width: '100%' }}>
                          {({ width, height }) => (
                            <CodeEditor
                              width={width}
                              height={height}
                              language="text"
                              showLineNumbers={false}
                              showMiniMap={false}
                              onSave={onChange}
                              onBlur={onChange}
                              {...field}
                            />
                          )}
                        </AutoSizer>}
                      />
                    </Field>
                    <Field
                      label="Type"
                      required
                    >
                      <InputControl
                        name="type"
                        control={control}
                        render={({ field: { onChange, ...field } }) => <RadioButtonGroup {...field} options={typeOptions} onChange={(e) => { onChange(e); setCurrentEventAction({ ...currentEventAction, type: e }) }} />}
                      />
                    </Field>
                    <Field
                      label={currentEventAction.type === EventActionStateFilter.Code ? "Code Runner URL" : "Webhook URL"}
                      required
                      invalid={!!errors.url}
                      error={errors.url ? 'URL is required' : undefined}
                    >
                      <Input id="url-input" {...register("url")} autoFocus />
                    </Field>
                    <Field
                      label="Code Language"
                      required
                      style={{ display: currentEventAction.type === EventActionStateFilter.Code ? 'block' : 'none' }}
                    >
                      <InputControl
                        name="scriptLanguage"
                        control={control}
                        render={({ field: { onChange, ...field } }) => <RadioButtonGroup {...field} options={languageOptions} onChange={(e) => { onChange(e); setCurrentEventAction({ ...currentEventAction, scriptLanguage: e }) }} />}
                      />
                    </Field>
                    <Field
                      label="Code"
                      required
                      style={{ display: currentEventAction.type === EventActionStateFilter.Code ? 'block' : 'none' }}
                    >
                      <InputControl
                        name="script"
                        control={control}
                        render={({ field: { onBlur, onChange, ...field } }) => <AutoSizer style={{ height: '600px', width: '100%' }}>
                          {({ width, height }) => (
                            <CodeEditor
                              width={width}
                              height={height}
                              language={currentEventAction.scriptLanguage}
                              showLineNumbers={true}
                              showMiniMap={true}
                              onSave={onChange}
                              onBlur={onChange}
                              {...field}
                            />
                          )}
                        </AutoSizer>}
                      />

                    </Field>
                  </FieldSet>
                  <Button type="submit">Update</Button>
                </>
              );
            }}
          </Form>


        </div>
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Delete event action"
          body="Are you sure you want to delete this event action?"
          confirmText="Delete event action"
          onConfirm={handleEventActionsDelete}
          onDismiss={showDeleteEventActionsModal(false)}
        />
      </Page.Contents>
    </Page>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    headerContainer: css`
      display: flex;
      margin-bottom: ${theme.spacing(2)};
      align-items: center;

      h3 {
        margin-bottom: ${theme.spacing(0.5)};
        flex-grow: 1;
      }
    `,
    headerAvatar: css`
      margin-right: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(0.6)};
      img {
        width: 25px;
        height: 25px;
        border-radius: 50%;
      }
    `,
    returnButton: css`
      margin-right: ${theme.spacing(1)};
    `,
    buttonRow: css`
      > * {
        margin-right: ${theme.spacing(2)};
      }
    `,
    pageBody: css`
      padding-left: ${theme.spacing(5.5)};
    `,
    tokensListHeader: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
    `,
  };
};

const EventActionsPage = connector(EventActionsPageUnconnected);
export default EventActionsPage;
