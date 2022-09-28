import React from 'react';

import { SceneTimePicker } from './SceneTimePicker';
import { TimeRangeContextProvider } from './TimeRangeContext';

interface SceneProps {
  title: string;
}

export function Scene(props: React.PropsWithChildren<SceneProps>) {
  return (
    <TimeRangeContextProvider>
      <h1>{props.title}</h1>
      <SceneTimePicker />
      <div>{props.children}</div>
    </TimeRangeContextProvider>
  );
}
