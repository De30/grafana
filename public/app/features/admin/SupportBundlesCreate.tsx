import React, { useCallback, } from 'react';

import { getBackendSrv, locationService } from '@grafana/runtime';
import { Form, Button, , Field, FieldSet, Switch, InlineFieldRow, InlineField, InlineSwitch } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

// move to types
export interface SupportBundleCreateRequest {
  componentNames: string[];
}

export interface Props { }

const createSupportBundle = async (data: SupportBundleCreateRequest) => {
    const result = await getBackendSrv().post('/api/admin/support-bundles', data);
    return result;
};

export const SupportBundlesCreate = ({ }: Props): JSX.Element => {
    const onSubmit = useCallback(
        async (data) => {
            try {
                const selectedLabelsArray = Object.keys(data).filter((key) => data[key]);
                const response = await createSupportBundle( { componentNames: selectedLabelsArray });
                console.info(response);
            } catch (e) {
                console.error(e);
            }

            locationService.push('/admin/support-bundles');
        },
        []
    );

    const labels = { "basic": true, "SAML": true}

    return (
        <Page navId="support-bundles" pageNav={{ text: 'Create support bundle' }}>
            <Page.Contents>
                <Page.OldNavOnly>
                    <h3 className="page-sub-heading">Create support bundle</h3>
                </Page.OldNavOnly>
                <Form  defaultValues={labels} onSubmit={onSubmit} validateOn="onSubmit">
                    {({ register, errors }) => {
                        return (
                            <>
                            <InlineFieldRow>
                                <InlineField label="Basic">
                                    <InlineSwitch
                                        value={true}
                                        onChange={(event) => { }}
                                    />
                                </InlineField>
                            </InlineFieldRow>
                                <Button type="submit">Create</Button>
                            </>
                        );
                    }}
                </Form>
            </Page.Contents>
        </Page>
    );
};

export default SupportBundlesCreate;
