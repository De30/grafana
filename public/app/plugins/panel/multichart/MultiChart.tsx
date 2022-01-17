import React, { useMemo } from 'react';
import { VizRepeater, TimeSeries, VizLegendOptions, LegendDisplayMode, VizRepeaterRenderValueProps } from '@grafana/ui';
import { DataFrame, FieldType, PanelProps, VizOrientation } from '@grafana/data';

import { config } from 'app/core/config';
import { MultiChartOptions } from './types';
import { prepareGraphableFields } from '../timeseries/utils';
import { PanelDataErrorView } from '@grafana/runtime';

const legendOptions: VizLegendOptions = {
  displayMode: LegendDisplayMode.Hidden,
  placement: 'bottom',
  calcs: [],
};

export function MultiChart(props: PanelProps<MultiChartOptions>) {
  const { height, width, data, renderCounter, timeRange, timeZone, id } = props;

  const frames = useMemo(() => prepareGraphableFields(data.series, config.theme2), [data]);

  if (!frames) {
    return <PanelDataErrorView panelId={id} data={data} needsTimeField={true} needsNumberField={true} />;
  }

  const renderChart = ({ width, height, value, count, index }: VizRepeaterRenderValueProps<DataFrame, any>) => {
    for (const field of value.fields) {
      if (field.type === FieldType.time && count !== index + 1) {
        field.config.custom = field.config.custom ?? {};
        field.config.custom.axisHidden = true;
      }
    }

    return (
      <TimeSeries
        frames={[value]}
        structureRev={data.structureRev}
        timeRange={timeRange}
        timeZone={timeZone}
        width={width}
        height={height}
        legend={legendOptions}
      />
    );
  };

  return (
    <VizRepeater
      getValues={() => getSeries(frames)}
      renderValue={renderChart}
      width={width}
      height={height}
      source={data}
      itemSpacing={3}
      renderCounter={renderCounter}
      autoGrid={true}
      orientation={VizOrientation.Horizontal}
    />
  );
}

function getSeries(frames: DataFrame[]): DataFrame[] {
  return frames;
}
