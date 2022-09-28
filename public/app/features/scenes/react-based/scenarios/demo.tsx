import React from 'react';
import { PanelData } from '@grafana/data';
import { Dashboard } from '../components/Dashboard';
import { FlexLayout, FlexLayoutItem } from '../components/FlexLayout';
import { RepeatBySeries } from '../components/RepeatBySeries';
import { VizPanel } from '../components/VizPanel';

export function getFlexLayoutTest() {
  const data = useDataSourceQuery({
    queries: [
      {
        refId: 'A',
        datasource: {
          uid: 'gdev-testdata',
          type: 'testdata',
        },
        seriesCount: 2,
        alias: '__server_names',
        scenarioId: 'random_walk',
      },
    ],
  });

  return (
    <Dashboard title="Flex layout test" actions={{ timepicker: true }}>
      <FlexLayout direction="row">
        <FlexLayoutItem size={{ minWidth: '70%' }}>
          <VizPanel pluginId="timeseries" title="Dynamic height and width" data={data} />
        </FlexLayoutItem>
        <FlexLayoutItem>
          <FlexLayout direction="column">
            <FlexLayoutItem>
              <VizPanel pluginId="timeseries" title="Dynamic height and width" data={data} />
            </FlexLayoutItem>
            <FlexLayoutItem>
              <VizPanel pluginId="timeseries" title="Dynamic height and width" data={data} />
            </FlexLayoutItem>
            <FlexLayoutItem size={{ ySizing: 'content' }}>
              <CanvasText text="Size to content" fontSize={20} align="center" />
            </FlexLayoutItem>
          </FlexLayout>
        </FlexLayoutItem>
      </FlexLayout>
    </Dashboard>
  );
}

export function getScenePanelRepeaterTest() {
  const data = useDataSourceQuery({
    queries: [
      {
        refId: 'A',
        datasource: {
          uid: 'gdev-testdata',
          type: 'testdata',
        },
        seriesCount: 2,
        alias: '__server_names',
        scenarioId: 'random_walk',
      },
    ],
  });

  return (
    <Dashboard title="Panel repeater test">
      <FlexLayout direction="column">
        <FlexLayoutItem size={{ minHeight: 200 }}>
          <RepeatBySeries data={data}>
            <RowToRepeat />
          </RepeatBySeries>
        </FlexLayoutItem>
      </FlexLayout>
    </Dashboard>
  );
}

function RowToRepeat({ data }: { data?: PanelData }) {
  return (
    <FlexLayout>
      <FlexLayoutItem>
        <VizPanel pluginId="timeseries" title="title" data={data} options={{ legend: { displayMode: 'hidden' } }} />
      </FlexLayoutItem>
      <FlexLayoutItem size={{ width: 300 }}>
        <VizPanel
          pluginId="stat"
          title="title"
          data={data}
          fieldConfig={{ defaults: { displayName: 'Last' }, overrides: [] }}
          options={{ graphMode: 'none' }}
        />
      </FlexLayoutItem>
    </FlexLayout>
  );
}
