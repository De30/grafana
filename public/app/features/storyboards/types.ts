import type {
  ContentUpdateMessage,
  ReadySignalMessage,
  SaveMessage,
  OutboundNotebookMessage,
} from 'starboard-notebook';

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
  id: string;
  cells: any[]; //Fix later
}

export type StarboardNotebookIFrameOptions<ReceivedMessageType = OutboundNotebookMessage> = {
  src: string;
  autoResize: boolean;
  baseUrl?: string;
  notebookContent?: Promise<string> | string;
  onNotebookReadySignalMessage(payload: ReadySignalMessage['payload']): void;
  onSaveMessage(payload: SaveMessage['payload']): void | boolean | Promise<boolean>;
  onContentUpdateMessage(payload: ContentUpdateMessage['payload']): void;
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
