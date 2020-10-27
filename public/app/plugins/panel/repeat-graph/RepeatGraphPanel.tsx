import React, { CSSProperties } from 'react';
import { PanelProps } from '@grafana/data';
import { Options } from './types';
import { getTimeField, FieldType } from '@grafana/data';
import { Chart, Geom, Axis, Guide } from 'bizcharts';

const { Region, DataMarker, Text } = Guide;

interface Props extends PanelProps<Options> {}

interface ChartColors {
  bg1: string;
  bg2: string;
  grid: string;
  label: string;
  line: string;
  axis: string;
}

interface ChartDataPoint {
  time: number;
  value: number;
}

export const RepeatGraphPanel: React.FunctionComponent<Props> = ({ data, timeRange, width, height, options }) => {
  const chartData: ChartDataPoint[] = [];

  for (const series of data.series) {
    const { timeField } = getTimeField(series);
    if (!timeField) {
      continue;
    }

    for (const field of series.fields) {
      if (field.type !== FieldType.number) {
        continue;
      }

      for (let i = 0; i < field.values.length; i++) {
        const x = timeField.values.get(i);
        const y = field.values.get(i);

        chartData.push({
          time: x,
          value: y,
        });
      }
    }
  }

  const xFrom = timeRange.from.valueOf();
  const xTo = timeRange.to.valueOf();
  const xRange = xTo - xFrom;

  const scales = {
    time: {
      type: 'time',
      min: xFrom,
      max: xTo + xRange / 7,
      mask: 'MM:ss',
      tickCount: 6,
    },
  };

  const chartColors: ChartColors = {
    bg1: '#210c3f',
    bg2: '#0b44a5',
    grid: '#AAA',
    label: '#497bb8',
    line: '#6fdefa',
    axis: '#CCC',
  };

  const backgroundStyle: CSSProperties = {
    background: `transparent`,
  };

  const chartHeight = height - 60;
  const lastDataPoint = chartData[chartData.length - 1];

  return (
    <div style={backgroundStyle}>
      {renderHeading(options.title)}
      <Chart
        height={chartHeight}
        width={width}
        data={chartData}
        animate={true}
        scale={scales}
        padding={[10, 40, 40, 40]}
      >
        {renderAxis(chartColors)}
        {renderLineGeom(chartColors, lastDataPoint, xRange)}
      </Chart>
    </div>
  );
};

function renderHeading(title: string) {
  return <h2 style={{ padding: '16px', fontSize: '20px', color: '#bcbcbd' }}>{title}</h2>;
}

function renderAxis(colors: ChartColors) {
  const axisLine: any = {
    stroke: colors.axis,
    lineWidth: 1,
    strokeOpacity: 0.4,
  };

  const tickLine: any = {
    stroke: colors.axis,
    strokeOpacity: 0.4,
    lineWidth: 1,
  };

  const label = {
    textStyle: {
      fill: colors.label,
      opacity: 1,
    },
  };

  const grid = {
    lineStyle: {
      stroke: colors.grid,
      strokeOpacity: 0.4,
      lineDash: [] as number[],
    },
  };

  return (
    <>
      <Axis name="time" line={axisLine} tickLine={tickLine} label={label} />
      <Axis name="value" label={label} grid={grid} />
    </>
  );
}

function renderLineGeom(colors: ChartColors, lastData: ChartDataPoint, xRange: number) {
  const lineStyle: any = {
    stroke: colors.line,
    lineWidth: 1,
    shadowBlur: 5,
    shadowColor: '#7fedfc',
    shadowOffsetY: 0,
  };

  return (
    <>
      <Geom type="line" position="time*value" size={1} color={colors.line} style={lineStyle} shape="smooth" />
      <Guide>
        <Region
          top
          start={[lastData.time - xRange / 30, 'max']}
          end={[lastData.time + xRange / 30, 'min']}
          style={{
            fill: `l(100) 0:${colors.bg2} 1:${colors.line}`,
            fillOpacity: 1,
            opacity: 0.13,
          }}
        />
        <DataMarker
          top
          position={[lastData.time, lastData.value]}
          display={{ point: true, line: false }}
          style={{
            point: {
              lineWidth: 8,
              fill: 'white',
              stroke: colors.line,
              strokeOpacity: 0.5,
              r: 8,
            },
          }}
        />
        <Text
          top
          position={[lastData.time, lastData.value]}
          content={`${lastData.value.toFixed(1)}`}
          offsetX={20}
          style={{
            fill: '#EEE',
            fontSize: 24,
          }}
        />
      </Guide>
    </>
  );
}
