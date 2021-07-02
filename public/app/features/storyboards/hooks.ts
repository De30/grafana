import { useEffect, useState, useMemo } from 'react';
import { createQueryRunner } from '@grafana/runtime';
import { createStoryboard, getStoryboards, removeStoryboard, updateStoryboard } from './storage';
import { Storyboard } from './types';

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

  return { boards, updateBoard, createBoard, removeBoard };
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
