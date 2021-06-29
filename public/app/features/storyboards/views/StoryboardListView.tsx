import React from 'react';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { StoryboardList } from '../components/StoryboardList';
import { useSavedStoryboards } from '../hooks';
import { Button, VerticalGroup } from '@grafana/ui';

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');
  const { boards, removeBoard } = useSavedStoryboards();

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <VerticalGroup>
          <Button icon="plus">Create Storyboard</Button>
          <StoryboardList boards={boards} onRemove={(boardId) => removeBoard(boardId)} />
        </VerticalGroup>
      </Page.Contents>
    </Page>
  );
};

export default StoryboardListView;
