import React, { useMemo, useRef, useState } from 'react';
import {
  PanelProps,
  buildHistogram,
  getHistogramFields,
  CartesianCoords2D,
  DataFrame,
  GrafanaTheme2,
} from '@grafana/data';
import { css } from '@emotion/css';
import { Portal, UPlotConfigBuilder, useStyles2, useTheme2, VizTooltipContainer } from '@grafana/ui';

import { histogramFieldsToFrame } from '@grafana/data/src/transformations/transformers/histogram';
import { HoverEvent, setupConfig } from './config';
import { CloseButton } from 'app/core/components/CloseButton/CloseButton';
import { DataHoverView } from '../geomap/components/DataHoverView';
import { Histogram, getBucketSize } from './Histogram';
import { PanelOptions } from './models.gen';
import { TOOLTIP_OFFSET } from '../barchart/BarChartPanel';

type Props = PanelProps<PanelOptions>;

export const HistogramPanel: React.FC<Props> = ({ data, options, width, height }) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);

  const oldConfig = useRef<UPlotConfigBuilder | undefined>(undefined);
  const isToolTipOpen = useRef<boolean>(false);

  const [hover, setHover] = useState<HoverEvent | undefined>(undefined);
  const [coords, setCoords] = useState<CartesianCoords2D | null>(null);
  const [focusedSeriesIdx, setFocusedSeriesIdx] = useState<number | null>(null);
  const [focusedPointIdx, setFocusedPointIdx] = useState<number | null>(null);
  const [shouldDisplayCloseButton, setShouldDisplayCloseButton] = useState<boolean>(false);

  const onCloseToolTip = () => {
    isToolTipOpen.current = false;
    setCoords(null);
    setShouldDisplayCloseButton(false);
  };

  const onUPlotClick = () => {
    isToolTipOpen.current = !isToolTipOpen.current;

    // Linking into useState required to re-render tooltip
    setShouldDisplayCloseButton(isToolTipOpen.current);
  };

  const renderTooltip = (alignedFrame: DataFrame, seriesIdx: number | null, datapointIdx: number | null) => {
    // const field = seriesIdx == null ? null : alignedFrame.fields[seriesIdx];
    // if (field) {
    //   const disp = getFieldDisplayName(field, alignedFrame);
    //   seriesIdx = info.aligned.fields.findIndex((f) => disp === getFieldDisplayName(f, info.aligned));
    // }

    return (
      <>
        {shouldDisplayCloseButton && (
          <>
            <CloseButton onClick={onCloseToolTip} />
            <div className={styles.closeButtonSpacer} />
          </>
        )}
        <DataHoverView
          data={alignedFrame}
          rowIndex={datapointIdx}
          columnIndex={seriesIdx}
          sortOrder={options.tooltip.sort}
        />
      </>
    );
  };

  const histogram = useMemo(() => {
    if (!data?.series?.length) {
      return undefined;
    }
    if (data.series.length === 1) {
      const info = getHistogramFields(data.series[0]);
      if (info) {
        return histogramFieldsToFrame(info);
      }
    }
    const hist = buildHistogram(data.series, options);
    if (!hist) {
      return undefined;
    }

    return histogramFieldsToFrame(hist, theme);
  }, [data.series, options, theme]);

  if (!histogram || !histogram.fields.length) {
    return (
      <div className="panel-empty">
        <p>No histogram found in response</p>
      </div>
    );
  }

  const bucketSize = getBucketSize(histogram);

  console.log(oldConfig, 'hm');

  return (
    <Histogram
      options={options}
      theme={theme}
      legend={options.legend}
      structureRev={data.structureRev}
      width={width}
      height={height}
      alignedFrame={histogram}
      bucketSize={bucketSize}
    >
      {(config, alignedFrame) => {
        console.log(config, 'what');
        if (oldConfig.current !== config) {
          oldConfig.current = setupConfig({
            config,
            onUPlotClick,
            setFocusedSeriesIdx,
            setFocusedPointIdx,
            setCoords,
            setHover,
            isToolTipOpen,
          });
        }

        return (
          <Portal>
            {hover && coords && (
              <VizTooltipContainer
                position={{ x: coords.x, y: coords.y }}
                offset={{ x: TOOLTIP_OFFSET, y: TOOLTIP_OFFSET }}
                allowPointerEvents
              >
                {renderTooltip(alignedFrame, focusedSeriesIdx, focusedPointIdx)}
              </VizTooltipContainer>
            )}
          </Portal>
        );
      }}
    </Histogram>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  closeButtonSpacer: css`
    margin-bottom: 15px;
  `,
});
