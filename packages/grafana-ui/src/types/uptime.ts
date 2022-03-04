export interface Incident {
  title: string;
  description?: string;
  updates: IncidentUpdate[];
  type: IncidentType;
  startTime: Date;
  // in-progress incident will not have an endTime yet
  endTime?: Date;
}

export enum IncidentType {
  Maintenance = 'maintenance',
  Degraded = 'degraded',
  Outage = 'outage',
}

export interface IncidentUpdate {
  timestamp: Date;
  type: UpdateType;
  update: string;
}

export enum UpdateType {
  Investigating = 'investigating',
  Monitoring = 'monitoring',
  Update = 'update',
  Resolved = 'resolved',
}
