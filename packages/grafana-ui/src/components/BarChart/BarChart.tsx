import React, { FC, useMemo } from 'react';
import { DataFrame, DisplayValue, formattedValueToString, getColorForIndex, GrafanaTheme } from '@grafana/data';
import { useStyles, useTheme } from '../../themes/ThemeContext';
import tinycolor from 'tinycolor2';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { useComponentInstanceId } from '../../utils/useComponetInstanceId';
import { css } from 'emotion';
import { scaleBand, scaleLinear } from '@visx/scale';

export interface Props {
  height: number;
  width: number;
  data: DataFrame;
  xFieldIndex: number;
}

export const BarChart: FC<Props> = ({ width, height, data, xFieldIndex }) => {
  //const theme = useTheme();
  //const componentInstanceId = useComponentInstanceId('PieChart');
  //const styles = useStyles(getStyles);

  const xMax = width;
  const yMax = height;
  const xField = data.fields[xFieldIndex];
  const valueField = data.fields.filter((field, idx) => idx !== xFieldIndex)[0];
  const xDomain: any[] = [];

  for (let i = 0; i < xField.values.length; i++) {
    xDomain.push(xField.values.get(i));
  }

  // scales, memoize for performance
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        round: true,
        domain: xDomain,
        padding: 0.4,
      }),
    [xMax]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        round: true,
        domain: [0, 100],
      }),
    [yMax]
  );

  return (
    <svg width={width} height={height}>
      <rect width={width} height={height} fill="url(#teal)" rx={14} />
      <Group>
        {xField.values.toArray().map((xValue, idx) => {
          const barWidth = xScale.bandwidth();
          const barHeight = yMax - yScale(valueField.values.get(idx));
          const barX = xScale(xValue);
          const barY = yMax - barHeight;
          return (
            <Bar
              key={`bar-${xValue}`}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="rgba(23, 233, 217, .5)"
            />
          );
        })}
      </Group>
    </svg>
  );
};
