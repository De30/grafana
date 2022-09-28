import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { FlexLayout, FlexLayoutItem } from '../components/FlexLayout';
import { VizPanel } from '../components/VizPanel';

export function RowsScenario() {
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
    <Dashboard title="Scene with rows">
      <FlexLayout direction="column">
        <FlexLayoutItem>
          <Dashboard title="Overview" canCollapse>
            <FlexLayout direction="row">
              <FlexLayoutItem>
                <VizPanel pluginId="timeseries" title="Fill height" data={data} />
              </FlexLayoutItem>
              <FlexLayoutItem>
                <VizPanel pluginId="timeseries" title="Fill height" data={data} />
              </FlexLayoutItem>
            </FlexLayout>
          </Dashboard>
        </FlexLayoutItem>
        <FlexLayoutItem>
          <Dashboard title="More server details" canCollapse>
            <FlexLayout direction="row">
              <FlexLayoutItem>
                <VizPanel pluginId="timeseries" title="Fill height" data={data} />
              </FlexLayoutItem>
              <FlexLayoutItem>
                <VizPanel pluginId="timeseries" title="Fill height" data={data} />
              </FlexLayoutItem>
            </FlexLayout>
          </Dashboard>
        </FlexLayoutItem>
      </FlexLayout>
    </Dashboard>
  );
}
