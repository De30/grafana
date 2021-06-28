import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import React from 'react';

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');
  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h2>Hello</h2>
      </Page.Contents>
    </Page>
  );
};

export default StoryboardListView;
