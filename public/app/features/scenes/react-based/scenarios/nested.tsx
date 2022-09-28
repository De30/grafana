import React from 'react';
import { getDefaultTimeRange } from '@grafana/data';
import { Dashboard } from '../components/Dashboard';
import { FlexLayout, FlexLayoutItem } from '../components/FlexLayout';
import { VizPanel } from '../components/VizPanel';
import { RepeatBySeries } from '../components/RepeatBySeries';

export function NestedScene() {
  const data = useDataSourceQuery({
    queries: [
      {
        refId: 'A',
        datasource: {
          uid: 'gdev-testdata',
          type: 'testdata',
        },
        scenarioId: 'random_walk',
      },
    ],
  });

  return (
    <Dashboard title="Nested scene demo">
      <FlexLayout direction="column">
        <FlexLayoutItem>
          <VizPanel pluginId="timeseries" title="Data" data={data} />
        </FlexLayoutItem>
        <FlexLayoutItem>{getInnerDashboard('Inner dashboard')}</FlexLayoutItem>
      </FlexLayout>
    </Dashboard>
  );
}

export function getInnerDashboard(title: string) {
  const data = useDataSourceQuery({
    queries: [
      {
        refId: 'B',
        datasource: {
          uid: 'gdev-testdata',
          type: 'testdata',
        },
        scenarioId: 'random_walk',
      },
    ],
  });

  return (
    <Dashboard title={title}>
      <FlexLayout direction="row">
        <FlexLayoutItem>
          <VizPanel pluginId="timeseries" title="Data" data={data} />
        </FlexLayoutItem>
      </FlexLayout>
    </Dashboard>
  );
}
