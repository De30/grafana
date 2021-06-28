import React from 'react';
import { PanelRenderer } from 'app/features/panel/PanelRenderer';
import { PanelData, LoadingState, dateTime } from '@grafana/data';

export const StoryboardView = () => {
  const data: PanelData = {
    state: LoadingState.Done,
    series: [],
    timeRange: { from: dateTime(0), to: dateTime(1000), raw: { from: '0', to: '1000' } },
  };
  return <PanelRenderer pluginId="table" data={data} title="This is the title" width={2} height={2} />;
};

export default StoryboardView;
