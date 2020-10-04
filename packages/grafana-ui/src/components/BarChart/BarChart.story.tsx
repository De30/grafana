import React from 'react';
import { number } from '@storybook/addon-knobs';
import { BarChart } from '@grafana/ui';
import { withCenteredStory } from '../../utils/storybook/withCenteredStory';
import { toDataFrame } from '@grafana/data';

export default {
  title: 'Visualizations/BarChart',
  decorators: [withCenteredStory],
  component: BarChart,
};

const getKnobs = () => {
  return {
    width: number('Width', 600),
    height: number('Height', 400),
  };
};

export const basic = () => {
  const { width, height } = getKnobs();
  const data = toDataFrame({
    columns: ['City', 'Population'],
    rows: [
      ['Stockholm', 100],
      ['New York', 30],
      ['Paris', 10],
      ['Berlin', 20],
      ['Los Angeles', 60],
    ],
  });

  return <BarChart width={width} height={height} data={data} xFieldIndex={0} />;
};
