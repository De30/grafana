export type UpdateConfig = {
  [K in keyof UpdateCounters]: boolean;
};

export type UpdateCounters = {
  render: number;
  dataChanged: number;
  schemaChanged: number;
};

export enum DebugMode {
  Render = 'render',
  Events = 'events',
  Cursor = 'cursor',
  Options = 'options',
}

export interface DebugPanelOptions {
  mode: DebugMode;
  counters?: UpdateConfig;
  debugOptions?: {
    debugText?: string;
    l1?: {
      text: string;
      l2: {
        text: string;
      };
    };
  };
}

export interface DebugPanelFieldConfig {
  debugText?: string;
  l1?: {
    text: string;
    l2: {
      text: string;
    };
  };
}
