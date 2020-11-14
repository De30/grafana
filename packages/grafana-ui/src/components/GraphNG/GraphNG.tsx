import React, { useMemo, useRef } from 'react';
import {
  DataFrame,
  FieldConfig,
  FieldType,
  formattedValueToString,
  getFieldColorModeForField,
  getFieldDisplayName,
  getTimeField,
} from '@grafana/data';
import { mergeDataFrames } from './utils';
import { UPlotChart } from '../uPlot/Plot';
import { AxisSide, GraphCustomFieldConfig, PlotProps } from '../uPlot/types';
import { useTheme } from '../../themes';
import { VizLayout } from '../VizLayout/VizLayout';
import { LegendItem, LegendOptions } from '../Legend/Legend';
import { GraphLegend } from '../Graph/GraphLegend';
import { GraphConfigBuilder } from './GraphConfigBuilder';

const defaultFormatter = (v: any) => (v == null ? '-' : v.toFixed(1));

interface GraphNGProps extends Omit<PlotProps, 'data' | 'config'> {
  data: DataFrame[];
  legend?: LegendOptions;
}

export const GraphNG: React.FC<GraphNGProps> = ({
  data,
  children,
  width,
  height,
  legend,
  timeRange,
  timeZone,
  ...plotProps
}) => {
  const theme = useTheme();
  const alignedFrameWithGapTest = useMemo(() => mergeDataFrames(data), [data]);
  const legendItemsRef = useRef<LegendItem[]>([]);

  if (alignedFrameWithGapTest == null) {
    return (
      <div className="panel-empty">
        <p>No data found in response</p>
      </div>
    );
  }

  const { frame: alignedFrame, isGap } = alignedFrameWithGapTest;

  const currentConfig = useMemo(() => {
    const builder = new GraphConfigBuilder();

    let { timeIndex } = getTimeField(alignedFrame);

    if (timeIndex === undefined) {
      timeIndex = 0; // assuming first field represents x-domain
      builder.addScale({
        scaleKey: 'x',
      });
    } else {
      builder.addScale({
        scaleKey: 'x',
        isTime: true,
      });
    }
    builder.addAxis({
      scaleKey: 'x',
      isTime: true,
      side: AxisSide.Bottom,
      timeZone,
      theme,
    });

    let seriesIdx = 0;
    const legendItems: LegendItem[] = [];
    const uniqueScales: Record<string, boolean> = {};

    for (let i = 0; i < alignedFrame.fields.length; i++) {
      const field = alignedFrame.fields[i];
      const config = field.config as FieldConfig<GraphCustomFieldConfig>;
      const customConfig = config.custom;

      if (i === timeIndex || field.type !== FieldType.number) {
        continue;
      }

      const fmt = field.display ?? defaultFormatter;
      const scale = config.unit || '__fixed';

      if (!uniqueScales[scale]) {
        uniqueScales[scale] = true;
        builder.addScale({ scaleKey: scale });
        builder.addAxis({
          scaleKey: scale,
          label: config.custom?.axis?.label,
          size: config.custom?.axis?.width,
          side: config.custom?.axis?.side || AxisSide.Left,
          grid: config.custom?.axis?.grid,
          formatValue: v => formattedValueToString(fmt(v)),
          theme,
        });
      }

      // need to update field state here because we use a transform to merge framesP
      field.state = { ...field.state, seriesIndex: seriesIdx };

      const colorMode = getFieldColorModeForField(field);
      const seriesColor = colorMode.getCalculator(field, theme)(0, 0);

      builder.addSeries({
        scaleKey: scale,
        line: customConfig?.line?.show,
        lineColor: seriesColor,
        lineWidth: customConfig?.line?.width,
        points: customConfig?.points?.show,
        pointSize: customConfig?.points?.radius,
        pointColor: seriesColor,
        fill: customConfig?.fill?.alpha !== undefined,
        fillOpacity: customConfig?.fill?.alpha,
        fillColor: seriesColor,
        isGap,
      });

      if (legend?.isVisible) {
        legendItems.push({
          color: seriesColor,
          label: getFieldDisplayName(field, alignedFrame),
          isVisible: true,
          yAxis: customConfig?.axis?.side === 1 ? 3 : 1,
        });
      }

      seriesIdx++;
    }

    legendItemsRef.current = legendItems;
    return builder.getConfig();
  }, [alignedFrameWithGapTest]);

  let legendElement: React.ReactElement | undefined;

  if (legend?.isVisible && legendItemsRef.current.length > 0) {
    legendElement = (
      <VizLayout.Legend position={legend.placement} maxHeight="35%" maxWidth="60%">
        <GraphLegend placement={legend.placement} items={legendItemsRef.current} displayMode={legend.displayMode} />
      </VizLayout.Legend>
    );
  }

  return (
    <VizLayout width={width} height={height} legend={legendElement}>
      {(vizWidth: number, vizHeight: number) => (
        <UPlotChart
          data={alignedFrame}
          config={currentConfig}
          width={vizWidth}
          height={vizHeight}
          timeRange={timeRange}
          timeZone={timeZone}
          {...plotProps}
        >
          {children}
        </UPlotChart>
      )}
    </VizLayout>
  );
};
