import React, { useMemo, useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button, Checkbox, Form, Stack, TextArea } from '@grafana/ui';
import { DashboardModel } from 'app/features/dashboard/state';

import { SaveDashboardData, SaveDashboardOptions } from '../types';
import { getDataSourceSrv } from '@grafana/runtime';
import { AbstractQuery, DataQuery, hasQueryExportSupport } from '@grafana/data';
import store from '../../../../../core/store';

interface FormDTO {
  message: string;
}

export type SaveProps = {
  dashboard: DashboardModel; // original
  saveModel: SaveDashboardData; // already cloned
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit?: (clone: DashboardModel, options: SaveDashboardOptions, dashboard: DashboardModel) => Promise<any>;
  options: SaveDashboardOptions;
  onOptionsChange: (opts: SaveDashboardOptions) => void;
};

export type PanelDescriptor = {
  id: number;
  title: string;
  abstractQueriesWithDs: {
    dsName: string;
    abstractQuery: AbstractQuery;
    query: DataQuery;
  }[];
};

export type DashboardDescriptor = {
  uid: string;
  title: string;
  url: string;
  panels: PanelDescriptor[];
};

export const SaveDashboardForm = ({
  dashboard,
  saveModel,
  options,
  onSubmit,
  onCancel,
  onSuccess,
  onOptionsChange,
}: SaveProps) => {
  const hasTimeChanged = useMemo(() => dashboard.hasTimeChanged(), [dashboard]);
  const hasVariableChanged = useMemo(() => dashboard.hasVariableValuesChanged(), [dashboard]);

  const [saving, setSaving] = useState(false);

  return (
    <Form
      onSubmit={async (data: FormDTO) => {
        if (!onSubmit) {
          return;
        }
        setSaving(true);
        options = { ...options, message: data.message };

        try {
          const dashboardQueries = store.getObject('grafana.dashboard.abstractQueries', {}) as Record<
            string,
            DashboardDescriptor
          >;
          const dashboardId = saveModel.clone.uid;
          delete dashboardQueries[dashboardId];
          const panelDescriptors: PanelDescriptor[] = [];
          for (let panel of saveModel.clone.panels) {
            const ds = await getDataSourceSrv().get(panel.datasource);
            if (hasQueryExportSupport(ds)) {
              const queries = await ds.exportToAbstractQueries(panel.targets);
              panelDescriptors.push({
                id: panel.id,
                title: panel.title,
                abstractQueriesWithDs: queries.map((abstractQuery, index) => {
                  return {
                    dsName: ds.name,
                    abstractQuery,
                    query: panel.targets[index],
                  };
                }),
              });
            }
          }
          dashboardQueries[dashboardId] = {
            uid: dashboardId,
            title: saveModel.clone.title,
            url: '/d/' + dashboardId + '/',
            panels: panelDescriptors,
          };
          store.setObject('grafana.dashboard.abstractQueries', dashboardQueries);
        } catch (error) {
          console.log(error);
        }

        const result = await onSubmit(saveModel.clone, options, dashboard);
        if (result.status === 'success') {
          if (options.saveVariables) {
            dashboard.resetOriginalVariables();
          }
          if (options.saveTimerange) {
            dashboard.resetOriginalTime();
          }
          onSuccess();
        } else {
          setSaving(false);
        }
      }}
    >
      {({ register, errors }) => {
        const messageProps = register('message');
        return (
          <Stack direction="column" gap={2}>
            {hasTimeChanged && (
              <Checkbox
                checked={!!options.saveTimerange}
                onChange={() =>
                  onOptionsChange({
                    ...options,
                    saveTimerange: !options.saveTimerange,
                  })
                }
                label="Save current time range as dashboard default"
                aria-label={selectors.pages.SaveDashboardModal.saveTimerange}
              />
            )}
            {hasVariableChanged && (
              <Checkbox
                checked={!!options.saveVariables}
                onChange={() =>
                  onOptionsChange({
                    ...options,
                    saveVariables: !options.saveVariables,
                  })
                }
                label="Save current variable values as dashboard default"
                aria-label={selectors.pages.SaveDashboardModal.saveVariables}
              />
            )}
            <TextArea
              {...messageProps}
              aria-label="message"
              value={options.message}
              onChange={(e) => {
                onOptionsChange({
                  ...options,
                  message: e.currentTarget.value,
                });
                messageProps.onChange(e);
              }}
              placeholder="Add a note to describe your changes."
              autoFocus
              rows={5}
            />

            <Stack alignItems="center">
              <Button variant="secondary" onClick={onCancel} fill="outline">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!saveModel.hasChanges}
                icon={saving ? 'fa fa-spinner' : undefined}
                aria-label={selectors.pages.SaveDashboardModal.save}
              >
                Save
              </Button>
              {!saveModel.hasChanges && <div>No changes to save</div>}
            </Stack>
          </Stack>
        );
      }}
    </Form>
  );
};
