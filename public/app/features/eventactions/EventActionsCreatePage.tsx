import React, { useCallback } from 'react';

import { getBackendSrv, locationService } from '@grafana/runtime';
import { Form, Button, Input, Field, FieldSet } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/core';
import { EventActionsDTO } from 'app/types';


const BASE_URL = `/api/eventactions`;

export interface Props { }

const createEventAction = async (sa: EventActionsDTO) => {
  const result = await getBackendSrv().post(`${BASE_URL}/`, sa);
  await contextSrv.fetchUserPermissions();
  return result;
};


export const EventActionCreatePage = ({ }: Props): JSX.Element => {
  const onSubmit = useCallback(
    async (data: EventActionsDTO) => {
      const response = await createEventAction(data);
      locationService.push(`/org/eventactions/${response.id}`);
    },
    []
  );



  return (
    <Page navId="eventactions" pageNav={{ text: 'Create event action' }}>
      <Page.Contents>
        <Page.OldNavOnly>
          <h3 className="page-sub-heading">Create event action</h3>
        </Page.OldNavOnly>
        <Form onSubmit={onSubmit} validateOn="onSubmit">
          {({ register, errors }) => {
            return (
              <>
                <FieldSet>
                  <Field
                    label="Name"
                    required
                    invalid={!!errors.name}
                    error={errors.name ? 'Name is required' : undefined}
                  >
                    <Input id="name-input" {...register('name', { required: true })} autoFocus />
                  </Field>
                </FieldSet>
                <Button type="submit">Create</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

export default EventActionCreatePage;
