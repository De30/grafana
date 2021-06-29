import React from 'react';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { StarboardNotebook } from '../components/StarboardNotebook';

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <StarboardNotebook />
      </Page.Contents>
    </Page>
  );
};

export default StoryboardListView;
