import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { useAsyncState } from 'app/store/store';
import { ExploreQueryParams } from 'app/types';
import React from 'react';
import { exploreReducer } from './state/main';
import Wrapper from './Wrapper';

interface RouteProps extends GrafanaRouteComponentProps<{}, ExploreQueryParams> {}

const Explore = (props: RouteProps) => {
  const ready = useAsyncState('explore', exploreReducer);

  if (!ready) {
    return null;
  }

  return <Wrapper {...props} />;
};

export default Explore;
