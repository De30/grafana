import { Observable } from 'rxjs';

export interface ActionValue {
  path: string;
  value?: any;
}

export interface ActionRequest {
  /** The url path where this was sent from (the dashboard id) */
  page?: string;

  /** Optional key from the form panel */
  id?: string;

  /** Optional user defined comment */
  comment?: string;

  /** List of things to change */
  action: ActionValue[];
}

export interface ActionFeedback {
  path: string;
  error?: string;
  warning?: string;
  msg?: string;
}

export interface ActionResponse {
  code: number;
  status: string; // String version of status code
  feedback?: ActionFeedback[];
}

/**
 * Alpha since Grafana 7.4
 */
export interface ActionSupport {
  /**
   * send the request response
   */
  process(req: ActionRequest): Observable<ActionResponse>;
}
