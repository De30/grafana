import React, { useContext, useState } from 'react';
import { getDefaultTimeRange, TimeRange } from '@grafana/data';

interface TimeRangeContextType {
    timeRange: TimeRange;
    setTimeRange: (timeRange: TimeRange) => never;
  };

export const TimeRangeContext = React.createContext({
  timeRange: getDefaultTimeRange(),
  setTimeRange: (timeRange: TimeRange) => {throw Error('You are using TimeRangeContext.Consumer without a Provider upper in the herarchy. Please use TimeRangeProvider with the desired value')},
});

export const useTimeRange = () => {
  const { timeRange, setTimeRange } = useContext<TimeRangeContextType>(TimeRangeContext);

  return { timeRange, setTimeRange };
};

interface TimeRangeProviderProps {
    children: React.ReactNode;
    defaultValue: TimeRange;
}

export function TimeRangeProvider({ children, defaultValue }: TimeRangeProviderProps) {
  const [timeRange, setTimeRange] = useState(defaultValue || getDefaultTimeRange());

  return <TimeRangeContext.Provider value={{ timeRange, setTimeRange }}>{children}</TimeRangeContext.Provider>;
}
