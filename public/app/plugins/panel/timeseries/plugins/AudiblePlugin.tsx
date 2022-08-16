import React, { useCallback, useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';

import {
  DataFrame,
  DataFrameFieldIndex,
  TIME_SERIES_TIME_FIELD_NAME,
  TIME_SERIES_VALUE_FIELD_NAME,
} from '@grafana/data';
import { EventsCanvas, FIXED_UNIT, UPlotConfigBuilder } from '@grafana/ui';
import appEvents from 'app/core/app_events';
import { AudiblePanelEvent } from 'app/types/events';

import { AudibleMarker } from './AudibleMarker';

interface PluginProps {
  config: UPlotConfigBuilder;
  frames: DataFrame[];
}

export const AudiblePlugin: React.FC<PluginProps> = ({ frames, config }) => {
  // const plotCtx = usePlotContext();
  const plotInstance = useRef<uPlot>();
  const [audibleFieldIndex, setAudibleFieldIndex] = useState<DataFrameFieldIndex>({ frameIndex: 0, fieldIndex: 0 });

  useEffect(() => {
    const sub = appEvents.subscribe(AudiblePanelEvent, (event) => {
      setAudibleFieldIndex({ fieldIndex: event.payload.pointIndex, frameIndex: event.payload.seriesIndex });
    });
    return () => sub.unsubscribe();
  }, []);

  const mapExemplarToXYCoords = useCallback(
    (dataFrame: DataFrame, dataFrameFieldIndex: DataFrameFieldIndex) => {
      if (
        dataFrameFieldIndex.fieldIndex !== audibleFieldIndex.fieldIndex ||
        dataFrameFieldIndex.frameIndex !== audibleFieldIndex.frameIndex
      ) {
        return undefined;
      }
      //const plotInstance = plotCtx.plot;
      const time = dataFrame.fields.find((f) => f.name === TIME_SERIES_TIME_FIELD_NAME);
      const value = dataFrame.fields.find((f) => f.name === TIME_SERIES_VALUE_FIELD_NAME);

      if (!time || !value || !plotInstance.current) {
        return undefined;
      }

      // Filter x, y scales out
      const yScale =
        Object.keys(plotInstance.current.scales).find((scale) => !['x', 'y'].some((key) => key === scale)) ?? FIXED_UNIT;

      let y = value.values.get(dataFrameFieldIndex.fieldIndex);
      return {
        x: plotInstance.current.valToPos(time.values.get(dataFrameFieldIndex.fieldIndex), 'x'),
        y: plotInstance.current.valToPos(y, yScale),
      };
    },
    [plotInstance, audibleFieldIndex]
  )

  const renderMarker = useCallback(
    (dataFrame: DataFrame, dataFrameFieldIndex: DataFrameFieldIndex) => {
      return <AudibleMarker dataFrame={dataFrame} dataFrameFieldIndex={dataFrameFieldIndex} config={config} />;
    },
    [config]
  );

  return (
    <EventsCanvas
      config={config}
      id="audible"
      events={frames}
      renderEventMarker={renderMarker}
      mapEventToXYCoords={mapExemplarToXYCoords}
    />
  );
};
