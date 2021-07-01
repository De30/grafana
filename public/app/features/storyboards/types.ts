// import type {
//   ContentUpdateMessage,
//   ReadySignalMessage,
//   SaveMessage,
//   OutboundNotebookMessage,
// } from 'starboard-notebook';

import { DataQuery, RawTimeRange } from '@grafana/data';

export type OutboundNotebookMessage = { type: unknown; payload: any };
export type InboundNotebookMessage = { type: unknown; payload: any };

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
  notebook: string;
}

export type StarboardNotebookIFrameOptions<ReceivedMessageType = OutboundNotebookMessage> = {
  src: string;
  autoResize: boolean;
  baseUrl?: string;
  notebookContent?: Promise<string> | string;
  onNotebookReadySignalMessage(payload: unknown /*ReadySignalMessage['payload']*/): void;
  onSaveMessage(payload: unknown /* SaveMessage['payload']*/): void | boolean | Promise<boolean>;
  onContentUpdateMessage(payload: unknown /* ContentUpdateMessage['payload']*/): void;
  onMessage(message: ReceivedMessageType): void;
  onUnsavedChangesStatusChange(hasUnsavedChanges: boolean): void;
  sandbox: string;
  preventNavigationWithUnsavedChanges: boolean;
};

interface StarboardNotebookMessageSignalReady {
  type: 'SIGNAL_READY';
}

interface StarboardNotebookMessageSetNotebookContent {
  type: 'SET_NOTEBOOK_CONTENT';
}

interface StarboardNotebookMessageNotebookContentUpdate {
  type: 'NOTEBOOK_CONTENT_UPDATE';
}

interface StarboardNotebookMessageSave {
  type: 'SAVE';
}

export type StarboardNotebookMessage =
  | StarboardNotebookMessageSignalReady
  | StarboardNotebookMessageSetNotebookContent
  | StarboardNotebookMessageNotebookContentUpdate
  | StarboardNotebookMessageSave;

type StoryboardId = string;

export interface StoryboardVariable {
  value: unknown;
}

export interface StoryboardContext {
  [property: string]: StoryboardVariable;
}

export interface StoryboardCsv {
  id: StoryboardId;
  type: 'csv';
  content: string;
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
  type: 'markdown';
  content: string;
}

export interface StoryboardPython {
  id: StoryboardId;
  type: 'python';
  script: string;
}

export type StoryboardDocumentElement =
  | StoryboardPlainText
  | StoryboardCsv
  | StoryboardMarkdown
  | StoryboardPython
  | StoryboardDatasourceQuery;

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
