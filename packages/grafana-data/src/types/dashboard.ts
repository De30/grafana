import { FieldConfigSource } from './fieldOverrides';
import { DataQuery, DataSourceRef } from './query';

export enum DashboardCursorSync {
  Off,
  Crosshair,
  Tooltip,
}

/**
 * @public
 */
export interface PanelModel<TOptions = any, TCustomFieldConfig = any> {
  /** ID of the panel within the current dashboard */
  id: number;

  /** Panel title */
  title?: string;

  /** Description */
  description?: string;

  /** Panel options */
  options: TOptions;

  /** Field options configuration */
  fieldConfig: FieldConfigSource<TCustomFieldConfig>;

  /** Version of the panel plugin */
  pluginVersion?: string;

  /** The datasource used in all targets */
  datasource?: DataSourceRef | null;

  /** The queries in a panel */
  targets?: DataQuery[];

  // Drilldown queries are query alternatives defined for a given dimension. Those are executed internchangibly
  // with the panel original targets when drill down is clicked.
  drilldownQueries?: Record<string, object[]>;
  /** drilldownQueries?: Record<string, Array<Record<string, any>>>; */

  panelDrilldownDimensions?: DrilldownDimension[];

  /** alerting v1 object */
  alert?: any;
}
export interface DrilldownDimension {
  name: string;
}
