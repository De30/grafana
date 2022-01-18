import { DataQuery } from './query';
import { RawTimeRange, TimeRange } from './time';

type AnyQuery = DataQuery & Record<string, any>;

/** @internal */
export interface ExploreUrlState<T extends DataQuery = AnyQuery> {
  datasource: string;
  queries: T[];
  range: RawTimeRange;
  originPanelId?: number;
  context?: string;
}

export interface ExplorePaneURLState<T extends DataQuery = DataQuery> {
  datasource: string;
  queries: T[];
  from: RawTimeRange['from'];
  to: RawTimeRange['to'];
}

export interface ExploreURLState {
  schemaVersion: number;
  left: ExplorePaneURLState;
  right?: ExplorePaneURLState;
}

/**
 * SplitOpen type is used in Explore and related components.
 */
export type SplitOpen = <T extends DataQuery = any>(
  options?: { datasourceUid: string; query: T; range?: TimeRange } | undefined
) => void;
