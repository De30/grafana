import React from 'react';

import { getDefaultTimeRange, TimeRange } from '@grafana/data';

interface TimeRangeContext {
  timeRange: TimeRange;
  setTimeRange: (timeRange: TimeRange) => void;
}

const TimeRangeContextRoot = React.createContext<TimeRangeContext>({
  timeRange: getDefaultTimeRange(),
  setTimeRange: () => {},
});

function TimeRangeContextProvider(props: React.PropsWithChildren<{}>) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(getDefaultTimeRange());

  return (
    <TimeRangeContextRoot.Provider value={{ timeRange, setTimeRange }}>{props.children}</TimeRangeContextRoot.Provider>
  );
}

function useTimeRange() {
  return React.useContext(TimeRangeContextRoot);
}

export { TimeRangeContextRoot, TimeRangeContextProvider, useTimeRange };
