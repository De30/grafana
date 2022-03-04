import React from 'react';
import { Story } from '@storybook/react';
import { UptimeSummary, UptimeSummaryProps } from './UptimeSummary';

export const AllOperational: Story<UptimeSummaryProps> = () => {
  return (
    <div>
      <UptimeSummary incidents={[]} />
    </div>
  );
};

export const WithIncident: Story<UptimeSummaryProps> = () => {
  return (
    <div>
      <UptimeSummary incidents={[]} />
    </div>
  );
};

export default {
  title: 'Uptime Summary',
  component: UptimeSummary,
};
