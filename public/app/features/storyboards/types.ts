import { DataFrame, DataQuery, RawTimeRange } from '@grafana/data';

export enum CellTypes {
  Markdown = 'markdown',
  Snapshot = 'snapshot',
  LibraryPanel = 'library-panel',
}

export interface Cell<T> {
  id: string;
  type: CellTypes;
  content: T;
}

export interface Storyboard {
  title: string;
  uid: string;
  /**
   *  String with the entire Starboard notebook
   */
  notebook: UnevaluatedStoryboardDocument;
}

type StoryboardId = string;

export interface StoryboardVariable {
  value: unknown;
  element?: StoryboardDocumentElement;
}

export interface StoryboardContext {
  [property: string]: StoryboardVariable;
}

export interface StoryboardCsv {
  id: StoryboardId;
  type: 'csv';
  content: {
    text: string;
    /**
     * Optional in the case no input has been given
     */
    data?: DataFrame[];
  };
}

export interface StoryboardPlainText {
  id: StoryboardId;
  type: 'plaintext';
  content: string;
}

export interface StoryboardDatasourceQuery {
  id: StoryboardId;
  type: 'query';
  datasource: string;
  query: DataQuery;
  timeRange: RawTimeRange;
}

export interface StoryboardMarkdown {
  id: StoryboardId;
  type: string;
  content: string;
  editing: boolean;
}

export interface StoryboardPython {
  id: StoryboardId;
  type: 'python';
  script: string;
}

export interface StoryboardTimeseriesPlot {
  id: StoryboardId;
  type: 'timeseries-plot';
  from: StoryboardId;
}

export type StoryboardDocumentElement =
  | StoryboardPlainText
  | StoryboardCsv
  | StoryboardMarkdown
  | StoryboardPython
  | StoryboardDatasourceQuery
  | StoryboardTimeseriesPlot;

// Describes an unevaluated Storyboard (no context)
export interface CoreStoryboardDocument {
  title: string;
  elements: StoryboardDocumentElement[];
}

export interface UnevaluatedStoryboardDocument extends CoreStoryboardDocument {
  status: 'unevaluated';
}

// Evaluated Storyboards have context, which is just results from evaluation bound to names. context is
// constructed as we evaluate, and then documents can observe the results appear
export interface EvaluatedStoryboardDocument extends CoreStoryboardDocument {
  status: 'evaluating' | 'evaluated';
  context: StoryboardContext;
}

export type StoryboardDocument = EvaluatedStoryboardDocument | UnevaluatedStoryboardDocument;
