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
