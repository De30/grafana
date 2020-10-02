import React, { FC, useEffect, useRef } from 'react';
import { DisplayValue, formattedValueToString, getColorFromHexRgbOrName } from '@grafana/data';
import { useTheme } from '../../index';
import ApexCharts from 'apexcharts';
import tinycolor from 'tinycolor2';

export enum PieChartType {
  Pie = 'pie',
  Donut = 'donut',
}

export interface Props {
  height: number;
  width: number;
  values: DisplayValue[];
  pieType: PieChartType;
  showLegend?: boolean;
}

export const PieChart: FC<Props> = ({ height, width, values, pieType, showLegend }) => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const chart = useRef<ApexCharts | null>(null);
  const theme = useTheme();
  const colors = ['blue', 'green', 'red', 'purple', 'orange'].map(c => getColorFromHexRgbOrName(c, theme.type));
  const themeFactor = theme.isDark ? 1 : -0.7;
  const gradientStart = pieType === PieChartType.Donut ? 60 : 0;

  const options = {
    series: values.map(item => item.numeric),
    labels: values.map(item => item.title),
    colors: colors,
    chart: {
      type: pieType,
      width,
      height,
      animations: {
        enabled: false,
        dynamicAnimation: {
          speed: 350,
        },
      },
    },
    stroke: {
      show: true,
      colors: [theme.colors.panelBg],
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        stops: [gradientStart, 100],
        colorStops: colors.map(c => {
          const bgColor2 = tinycolor(c)
            .darken(15 * themeFactor)
            .spin(8)
            .toRgbString();
          const bgColor3 = tinycolor(c)
            .darken(5 * themeFactor)
            .spin(-8)
            .toRgbString();

          return [
            { offset: gradientStart, color: bgColor2, opacity: 100 },
            { offset: 100, color: bgColor3, opacity: 100 },
          ];
        }),
      },
    },
    dataLabels: {
      enabled: true,
      // formatter: function(val: number, opts: { seriesIndex: number; dataPointIndex: number }) {
      //   return formattedValueToString(values[opts.seriesIndex]);
      // },
      style: {
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
        fontWeight: 'normal',
        colors: [theme.palette.white],
      },
      dropShadow: {
        enabled: false,
      },
    },
    legend: {
      show: showLegend,
      fontSize: '14px',
      labels: {
        colors: [theme.colors.text],
      },
      fontFamily: theme.typography.fontFamily,
    },
    tooltip: {
      enabled: true,
      fillSeriesColor: false,
      theme: theme.isDark ? 'dark' : 'light',
      style: {
        fontSize: '12px',
        fontFamily: undefined,
      },
      onDatasetHover: {
        highlightDataSeries: false,
      },
    },
  };

  useEffect(() => {
    if (!chart.current) {
      chart.current = new ApexCharts(elementRef.current, options);
      chart.current.render();
    } else {
      options.chart.animations.enabled = true;
      chart.current.updateOptions(options);
    }
  });

  return <div style={{ width, height }} ref={elementRef} />;
};

interface ApexFormatterOpts {
  seriesIndex: number;
  dataPointIndex: number;
}
