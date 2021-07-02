import { useEffect, useState, useMemo } from 'react';
import { createQueryRunner } from '@grafana/runtime';
import { createStoryboard, getStoryboards, removeStoryboard, updateStoryboard } from './storage';
import {
  Storyboard,
  StoryboardMarkdown,
  StoryboardCsv,
  StoryboardDatasourceQuery,
  StoryboardPlainText,
  StoryboardPython,
  StoryboardTimeseriesPlot,
} from './types';

export function useSavedStoryboards() {
  let [boards, setBoards] = useState<Storyboard[]>(getStoryboards());

  const updateBoardState = () => {
    const newBoards = getStoryboards();
    setBoards(newBoards);
  };

  const updateBoard = (board: Storyboard) => {
    updateStoryboard(board);
    updateBoardState();
  };

  const removeBoard = (boardId: string) => {
    removeStoryboard(boardId);
    updateBoardState();
  };

  const createBoard = (board: Storyboard) => {
    createStoryboard(board);
    updateBoardState();
  };

  const addCellToBoard = (type: string, board: Storyboard) => {
    const nextId = findNextIdForCellType(type, board);

    switch (type) {
      case 'markdown':
        const markdownCell: StoryboardMarkdown = {
          id: 'markdown' + nextId,
          type: 'markdown',
          content: '',
          editing: true,
        };
        board.notebook.elements.push(markdownCell);
        break;
      case 'csv':
        const csvCell: StoryboardCsv = {
          id: 'csv' + nextId,
          type: 'csv',
          content: {
            text: '',
          },
        };
        board.notebook.elements.push(csvCell);
        break;
      case 'query':
        const queryCell: StoryboardDatasourceQuery = {
          id: 'query' + nextId,
          type: 'query',
          datasource: '',
          query: {
            refId: '',
          },
          timeRange: { from: 'now', to: 'now-1d' },
        };
        board.notebook.elements.push(queryCell);
        break;
      case 'plaintext':
        const textCell: StoryboardPlainText = {
          id: 'plaintext' + nextId,
          type: 'plaintext',
          content: '',
        };
        board.notebook.elements.push(textCell);
        break;
      case 'python':
        const pythonCell: StoryboardPython = {
          id: 'python' + nextId,
          type: 'python',
          script: '',
        };
        board.notebook.elements.push(pythonCell);
        break;
      case 'timeseries-plot':
        const plotCell: StoryboardTimeseriesPlot = {
          id: 'timeseries-plot' + nextId,
          type: 'timeseries-plot',
          from: '',
        };
        board.notebook.elements.push(plotCell);
        break;
      default:
        throw new Error('bad element type:' + type);
    }
    updateBoard(board);
  };

  return { boards, updateBoard, createBoard, removeBoard, addCellToBoard };
}

export function useRunner() {
  const runner = useMemo(() => createQueryRunner(), []);

  useEffect(() => {
    const toDestroy = runner;
    return () => {
      return toDestroy.destroy();
    };
  }, [runner]);

  return runner;
}

function findNextIdForCellType(type: string, board: Storyboard) {
  // Scans the list of elements for their IDs of form "${type}${id}" to find a next unique id
  const elements = board.notebook.elements;

  const ids = Array.from(elements, (element) => element.id)
    .filter((id) => id.startsWith(type))
    .map((id) => Number(id.slice(type.length)));

  if (ids.length > 0) {
    return Math.max(...ids) + 1;
  } else {
    return 0;
  }
}
