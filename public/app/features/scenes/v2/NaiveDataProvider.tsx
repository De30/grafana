import React, { useEffect, useMemo } from 'react';
import { Subscription } from 'rxjs';

import { PanelData } from '@grafana/data';

import { DataQueryExtended, SceneQueryRunner } from './SceneQueryRunner';
import { useTimeRange } from './TimeRangeContext';

interface DataProviderContext {
  data: PanelData | null;
}

const DataProviderContextRoot = React.createContext<DataProviderContext>({ data: null });

export function NaiveDataProvider({ queries, children }: React.PropsWithChildren<{ queries: DataQueryExtended[] }>) {
  const runner = useMemo(() => new SceneQueryRunner({ queries }), [queries]);
  const { timeRange } = useTimeRange();
  const [data, setData] = React.useState<PanelData | null>(null);
  const subscription = React.useRef<Subscription>();

  useEffect(() => {
    runner.runWithTimeRange(timeRange).then((data) => {
      subscription.current = data?.subscribe({ next: (data) => setData(data) });
    });

    return () => {
      subscription.current?.unsubscribe();
    };
  }, [timeRange, queries, runner]);

  return <DataProviderContextRoot.Provider value={{ data }}>{children}</DataProviderContextRoot.Provider>;
}
