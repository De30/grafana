// Attribution: Parts copied & inspired by https://github.com/influxdata/giraffe
// MIT License Copyright (c) 2019 InfluxData

import { Field } from '@grafana/data';

export interface PlotConfig {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type SeriesConfig = LineSeriesConfig;

export interface LineSeriesConfig {
  type: 'line';
  /** series on/off. when off, it will not affect its scale */
  show?: boolean;
  /** scale key */
  scale?: string;
  xField: Field;
  yField: Field;

  fill?: string[];
  position?: LinePosition;
  hoverDimension?: LineHoverDimension | 'auto';
  maxTooltipRows?: number;
  interpolation?: LineInterpolation;
  lineWidth?: number;
  colors?: string[];
  shadeBelow?: boolean;
  shadeBelowOpacity?: number;
}

/*
  The tooltip for a line layer can operate in one of three modes:
  In the `x` mode, every y-value for the currently hovered x-value is displayed
  in the tooltip. The crosshair is a vertical line.
  In the `y` mode, every x-value for the currently hovered y-value is displayed
  in the tooltip. The crosshair is a horizontal line.
  In the `xy` mode, the single xy-point closest to the hovered mouse position
  is displayed in the tooltip. The series that it belongs to is highlighted.
  The crosshair is an intersecting pair of horizontal and vertical lines.
*/
export type LineHoverDimension = 'x' | 'y' | 'xy';

export type LinePosition = 'overlaid' | 'stacked';

export type HistogramPosition = 'overlaid' | 'stacked';

export type LineInterpolation =
  | 'linear'
  | 'monotoneX'
  | 'monotoneY'
  | 'cubic'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | 'natural';
