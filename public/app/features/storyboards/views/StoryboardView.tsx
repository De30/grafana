import React, { FC } from 'react';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { useSavedStoryboards } from '../hooks';
import { Storyboard } from '../types';
import { StarboardNotebook } from '../components/StarboardNotebook';
import { getLocationSrv } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

interface StoryboardRouteParams {
  uid: string;
}
const locationSrv = getLocationSrv();

export const StoryboardView: FC<StoryboardRouteParams> = ({ uid }) => {
  const { boards } = useSavedStoryboards();
  const board = boards.find((b) => b.uid === uid);
  if (!board) {
    locationSrv.update({ path: '/storyboards', partial: true });
  }

  const { title, notebook } = board as Storyboard;
  const navModel = {
    main: {
      text: title,
      icon: 'book-open',
    },
    node: {
      text: 'Storyboards',
    },
  };
  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <StarboardNotebook initialNotebook={notebook} />
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps = (state: StoreState, props: GrafanaRouteComponentProps<StoryboardRouteParams>) => {
  return {
    uid: props.match.params.uid,
  };
};

export default connect(mapStateToProps)(StoryboardView);
