import React from 'react';

import { NaiveDataProvider } from '../NaiveDataProvider';
import { Scene } from '../Scene';
import { useTimeRange } from '../TimeRangeContext';

const basic = () => ({
  title: '[v2] Basic',
  getScene: () => {
    return (
      <Scene title={'Basic scene example'}>
        <TimeRangePreview />
        <NaiveDataProvider
          queries={[
            {
              refId: 'A',
              datasource: {
                uid: 'gdev-testdata',
                type: 'testdata',
              },
              scenarioId: 'random_walk',
            },
          ]}
        />

        <Scene title={'Nested scene'}>
          <TimeRangePreview />
          <NaiveDataProvider
            queries={[
              {
                refId: 'A',
                datasource: {
                  uid: 'gdev-testdata',
                  type: 'testdata',
                },
                scenarioId: 'random_walk_table',
              },
            ]}
          />
        </Scene>
      </Scene>
    );
  },
});

function TimeRangePreview() {
  const timeRange = useTimeRange();
  return <div>{JSON.stringify(timeRange.timeRange)}</div>;
}

export { basic };
