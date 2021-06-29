import React, { FC } from 'react';
import { Card } from '@grafana/ui';
import { Storyboard } from '../types';

interface Props {
  boards: Storyboard[];
  onRemove: (boardId: string) => void;
}

export const StoryboardList: FC<Props> = ({ boards }) => {
  if (!boards.length) {
    return <p>No Storyboards found. Start by creating one!</p>;
  }
  return (
    <>
      {boards.map((board) => (
        <Card key={board.uid} heading={board.title} />
      ))}
    </>
  );
};
