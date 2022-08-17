import { WithAccessControlMetadata } from '@grafana/data';


export interface EventActionsDTO extends WithAccessControlMetadata {
  id: number;
  orgId: number;
  name: string;
  description: string;
  type: string;
  url: string;
  script: string;
  scriptLanguage: string;
  runnerSecret: string;
}


export interface EventActionsProfileState {
  eventAction: EventActionsDTO;
  isLoading: boolean;
}

export enum EventActionStateFilter {
  All = 'All',
  Webhook = 'webhook',
  Code = 'code',
}

export interface EventActionsState {
  eventActions: EventActionsDTO[];
  isLoading: boolean;

  // search / filtering
  query: string;
  perPage: number;
  page: number;
  totalPages: number;
  showPaging: boolean;
  eventActionStateFilter: EventActionStateFilter;
}

