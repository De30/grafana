import tinycolor from 'tinycolor2';
import uPlot, { Series } from 'uplot';
import { getCanvasContext } from '../../../utils/measureText';
import {
  DrawStyle,
  LineConfig,
  AreaConfig,
  PointsConfig,
  PointVisibility,
  LineInterpolation,
  AreaGradientMode,
} from '../config';
import { PlotConfigBuilder } from '../types';

export interface SeriesProps extends LineConfig, AreaConfig, PointsConfig {
  drawStyle: DrawStyle;
  scaleKey: string;
}

export class UPlotSeriesBuilder extends PlotConfigBuilder<SeriesProps, Series> {
  getConfig() {
    const {
      drawStyle,
      lineInterpolation,
      lineColor,
      lineWidth,
      showPoints,
      pointColor,
      pointSize,
      scaleKey,
      spanNulls,
    } = this.props;

    let lineConfig: Partial<Series> = {};

    if (drawStyle === DrawStyle.Points) {
      lineConfig.paths = () => null;
    } else {
      lineConfig.stroke = lineColor;
      lineConfig.width = lineWidth;
      lineConfig.paths = (self: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        let pathsBuilder = mapDrawStyleToPathBuilder(drawStyle, lineInterpolation);
        return pathsBuilder(self, seriesIdx, idx0, idx1);
      };
    }

    const pointsConfig: Partial<Series> = {
      points: {
        stroke: pointColor,
        fill: pointColor,
        size: pointSize,
      },
    };

    // we cannot set points.show property above (even to undefined) as that will clear uPlot's default auto behavior
    if (showPoints === PointVisibility.Auto) {
      if (drawStyle === DrawStyle.Bars) {
        pointsConfig.points!.show = false;
      }
    } else if (showPoints === PointVisibility.Never) {
      pointsConfig.points!.show = false;
    } else if (showPoints === PointVisibility.Always) {
      pointsConfig.points!.show = true;
    }

    return {
      scale: scaleKey,
      spanGaps: spanNulls,
      fill: this.getFill(),
      ...lineConfig,
      ...pointsConfig,
    };
  }

  getFill(): Series.Fill | undefined {
    const { lineColor, fillColor, fillGradient, fillOpacity } = this.props;

    if (fillColor) {
      return fillColor;
    }

    const mode = fillGradient ?? AreaGradientMode.None;
    let fillOpacityNumber = fillOpacity ?? 0;

    if (mode !== AreaGradientMode.None) {
      return getCanvasGradient({
        color: (fillColor ?? lineColor)!,
        opacity: fillOpacityNumber / 100,
        mode,
      });
    }

    if (fillOpacityNumber > 0) {
      return tinycolor(lineColor)
        .setAlpha(fillOpacityNumber / 100)
        .toString();
    }

    return undefined;
  }
}

interface PathBuilders {
  bars: Series.PathBuilder;
  linear: Series.PathBuilder;
  smooth: Series.PathBuilder;
  stepBefore: Series.PathBuilder;
  stepAfter: Series.PathBuilder;
}

let builders: PathBuilders | undefined = undefined;

function mapDrawStyleToPathBuilder(
  style: DrawStyle,
  lineInterpolation?: LineInterpolation,
  opts?: any
): Series.PathBuilder {
  // This should be global static, but Jest initalization was failing so we lazy load to avoid the issue
  if (!builders) {
    const pathBuilders = uPlot.paths;
    const barWidthFactor = 0.6;
    const barMaxWidth = Infinity;

    builders = {
      bars: pathBuilders.bars!({ size: [barWidthFactor, barMaxWidth] }),
      linear: pathBuilders.linear!(),
      smooth: pathBuilders.spline!(),
      stepBefore: pathBuilders.stepped!({ align: -1 }),
      stepAfter: pathBuilders.stepped!({ align: 1 }),
    };
  }

  if (style === DrawStyle.Bars) {
    return builders.bars;
  }
  if (style === DrawStyle.Line) {
    if (lineInterpolation === LineInterpolation.StepBefore) {
      return builders.stepBefore;
    }
    if (lineInterpolation === LineInterpolation.StepAfter) {
      return builders.stepAfter;
    }
    if (lineInterpolation === LineInterpolation.Smooth) {
      return builders.smooth;
    }
  }

  return builders.linear; // the default
}

interface AreaGradientOptions {
  color: string;
  mode: AreaGradientMode;
  opacity: number;
}

function getCanvasGradient(opts: AreaGradientOptions): (self: uPlot, seriesIdx: number) => CanvasGradient {
  return (plot: uPlot, seriesIdx: number) => {
    const { color, opacity } = opts;

    const ctx = getCanvasContext();
    const gradient = ctx.createLinearGradient(0, 0, 0, plot.bbox.height);

    gradient.addColorStop(0.55, '#FFFFFF');
    gradient.addColorStop(0.55, '#d4d4e7');
    gradient.addColorStop(0.56, '#d4d4e7');
    gradient.addColorStop(0.56, '#6469a7');
    gradient.addColorStop(0.58, '#6469a7');
    gradient.addColorStop(0.58, '#494f90');
    gradient.addColorStop(0.6, '#494f90');

    gradient.addColorStop(0.6, '#323694');
    gradient.addColorStop(0.75, '#323694');
    gradient.addColorStop(0.75, '#292d84');
    gradient.addColorStop(0.8, '#292d84');
    gradient.addColorStop(0.8, '#1d205b');
    gradient.addColorStop(0.85, '#1d205b');
    gradient.addColorStop(0.85, '#191850');
    gradient.addColorStop(0.9, '#191850');
    gradient.addColorStop(0.9, '#14153f');
    gradient.addColorStop(0.95, '#14153f');
    gradient.addColorStop(0.95, '#0b0d22');
    gradient.addColorStop(1, '#0b0d22');

    return gradient;
  };
}
