import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { store } from 'app/store/store';
import { ExploreQueryParams } from 'app/types';
import React, { useEffect, useState } from 'react';
import { Reducer } from 'redux';
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

const useAsyncState = (key: string, reducer: Reducer) => {
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(true);
    store.injectReducer(key, reducer);

    return () => {
      store.removeReducer(key);
    };
  }, [key, reducer]);

  return done;
};

export default Explore;
