import React from 'react';

import { SIGV4ConnectionConfig } from '@grafana/aws-sdk';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { AlertingSettings, DataSourceHttpSettings, Alert } from '@grafana/ui';
import { config } from 'app/core/config';
import { getAllAlertmanagerDataSources } from 'app/features/alerting/unified/utils/alertmanager';

import { PromOptions } from '../types';

import { AzureAuthSettings } from './AzureAuthSettings';
import { hasCredentials, setDefaultCredentials, resetCredentials } from './AzureCredentialsConfig';
import { PromSettings } from './PromSettings';

export type Props = DataSourcePluginOptionsEditorProps<PromOptions>;
export const ConfigEditor = (props: Props) => {
  const { options, onOptionsChange } = props;
  const alertmanagers = getAllAlertmanagerDataSources();

  const azureAuthSettings = {
    azureAuthSupported: config.featureToggles['prometheus_azure_auth'] ?? false,
    getAzureAuthEnabled: (config: DataSourceSettings<any, any>): boolean => hasCredentials(config),
    setAzureAuthEnabled: (config: DataSourceSettings<any, any>, enabled: boolean) =>
      enabled ? setDefaultCredentials(config) : resetCredentials(config),
    azureSettingsUI: AzureAuthSettings,
  };

  return (
    <>
      {options.access === 'direct' && (
          <Alert title="Deprecation Notice" severity="info">
            Brower access mode has been removed from this datasource
          </Alert>
        ) &&
        onOptionsChange({ ...options, access: 'proxy' })}

      <DataSourceHttpSettings
        defaultUrl="http://localhost:9090"
        dataSourceConfig={options}
        showAccessOptions={false}
        onChange={onOptionsChange}
        sigV4AuthToggleEnabled={config.sigV4AuthEnabled}
        azureAuthSettings={azureAuthSettings}
        renderSigV4Editor={<SIGV4ConnectionConfig {...props}></SIGV4ConnectionConfig>}
      />

      <AlertingSettings<PromOptions>
        alertmanagerDataSources={alertmanagers}
        options={options}
        onOptionsChange={onOptionsChange}
      />

      <PromSettings options={options} onOptionsChange={onOptionsChange} />
    </>
  );
};
