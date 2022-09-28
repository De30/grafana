import React from 'react';

import { PanelData } from '@grafana/data';

interface RepeatBySeriesProps {
  data: PanelData;
  children: React.ReactElement;
}

export function RepeatBySeries({ children, data }: RepeatBySeriesProps) {
  if (!data?.series || !React.Children.only(children)) {
    return [];
  }

  return data.series.map((series, idx) =>
    React.cloneElement(children, {
      key: `${series.name || idx}`,
      data: {
        ...data,
        series: [series],
      },
    })
  );
}
