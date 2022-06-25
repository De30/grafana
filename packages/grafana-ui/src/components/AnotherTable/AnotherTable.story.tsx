import { Meta } from '@storybook/react';
import React from 'react';

import { withCenteredStory } from '../../utils/storybook/withCenteredStory';

import mdx from './AnotherTable.mdx';

import { AnotherTable } from '.';

export default {
  title: 'Visualizations/AnotherTable',
  component: AnotherTable,
  decorators: [withCenteredStory],
  parameters: {
    controls: {
      exclude: ['onColumnResize', 'onSortByChange', 'onCellFilterAdded', 'ariaLabel', 'data', 'initialSortBy'],
    },
    docs: {
      page: mdx,
    },
  },
  args: {
    width: 700,
    height: 500,
    columnMinWidth: 150,
  },
} as Meta;

export const Basic = () => <AnotherTable data={{ fields: [{ id: '1', name: 'LOL', values: [1, 2, 3] }] }} />;
