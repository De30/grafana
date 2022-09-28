import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

import { AbsoluteTimeRange, FieldConfigSource, toUtc, PanelData } from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { PanelChrome } from '@grafana/ui';
import { useTimeRange } from '../context/timeRange';

export interface VizPanelProps {
  title?: string;
  pluginId: string;
  options?: object;
  fieldConfig?: FieldConfigSource;
  data?: PanelData
}

export function VizPanel(props:VizPanelProps) {
  const { title, pluginId, options, fieldConfig, data } = props;
  const {setTimeRange} = useTimeRange();
  
  const onSetTimeRange = (timeRange: AbsoluteTimeRange) => {
    setTimeRange({
      raw: {
        from: toUtc(timeRange.from),
        to: toUtc(timeRange.to),
      },
      from: toUtc(timeRange.from),
      to: toUtc(timeRange.to),
    });
  };

  return (
    <AutoSizer>
      {({ width, height }) => {
        if (width < 3 || height < 3) {
          return null;
        }

        return (
          <PanelChrome title={title} width={width} height={height}>
            {(innerWidth, innerHeight) => (
              <>
                <PanelRenderer
                  title="Raw data"
                  pluginId={pluginId}
                  width={innerWidth}
                  height={innerHeight}
                  data={data}
                  options={options}
                  fieldConfig={fieldConfig}
                  onOptionsChange={() => {}}
                  onChangeTimeRange={onSetTimeRange}
                />
              </>
            )}
          </PanelChrome>
        );
      }}
    </AutoSizer>
  );
}
