import store from 'app/core/store';
import { Storyboard } from './types';

const STORAGE_KEY = 'grafana.storyboards';

export const getStoryboards = (): Storyboard[] => {
  return store.getObject(STORAGE_KEY);
};

export const updateStoryboard = (newBoard: Storyboard) => {
  let boards = getStoryboards();
  for (let board of boards) {
    if (board.id === newBoard.id) {
      board = newBoard;
    }
  }
  store.setObject(STORAGE_KEY, boards);
};

export const createStoryboard = (newBoard: Storyboard) => {
  let boards = getStoryboards();
  boards.push(newBoard);
  store.setObject(STORAGE_KEY, boards);
};

export const removeBoard = (boardId: string) => {
  let boards = getStoryboards();
  const newBoards = boards.filter((board) => board.id !== boardId);
  store.setObject(STORAGE_KEY, newBoards);
};
