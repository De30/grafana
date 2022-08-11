import React, { useContext } from 'react';

import { GrafanaConfig } from '@grafana/data';
import { BackendSrv, LocationService } from '@grafana/runtime';

import { AppChromeService } from '../components/AppChrome/AppChromeService';

export interface GrafanaContextType {
  backend: BackendSrv;
  location: LocationService;
  config: GrafanaConfig;
  chrome: AppChromeService;
}

export const GrafanaContext = React.createContext<GrafanaContextType | undefined>(undefined);

export function useGrafana(): GrafanaContextType {
  const context = useContext(GrafanaContext);
  if (!context) {
    throw new Error('No GrafanaContext found');
  }
  return context;
}
