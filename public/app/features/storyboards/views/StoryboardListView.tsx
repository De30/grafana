import React, { useState } from 'react';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { StoryboardList } from '../components/StoryboardList';
import { useSavedStoryboards } from '../hooks';
import { Button, VerticalGroup } from '@grafana/ui';
import { StoryboardForm } from '../components/StoryboardForm';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_NOTEBOOK } from '../components/StarboardNotebook';
import { getLocationSrv } from '@grafana/runtime';

const locationSrv = getLocationSrv();

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');
  const [isCreatingBoard, setIsCreating] = useState(false);
  const { boards, createBoard, removeBoard } = useSavedStoryboards();

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <VerticalGroup>
          {isCreatingBoard ? (
            <StoryboardForm
              onSubmit={(values) => {
                const uid = uuidv4();
                createBoard({ ...values, uid, notebook: DEFAULT_NOTEBOOK });
                //Reroute to /storyboards/uid
                locationSrv.update({
                  partial: true,
                  path: `/storyboards/${uid}`,
                });
              }}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <Button icon="plus" onClick={() => setIsCreating(true)}>
              Create Storyboard
            </Button>
          )}
          <StoryboardList boards={boards} onRemove={(boardId) => removeBoard(boardId)} />
        </VerticalGroup>
      </Page.Contents>
    </Page>
  );
};

export default StoryboardListView;
