import React from 'react';
import { Story } from '@storybook/react';
import { IncidentTimeline, TimelineProps } from './IncidentTimeline';
import { UpdateType } from '../../types/uptime';

export const Default: Story<TimelineProps> = () => {
  return (
    <div>
      <IncidentTimeline
        updates={[
          {
            timestamp: new Date(Date.now() + 9000),
            update: 'Looks like we fixed it',
            type: UpdateType.Resolved,
          },
          {
            timestamp: new Date(Date.now() + 8000),
            update: 'We are monitoring if we fixed it',
            type: UpdateType.Monitoring,
          },
          {
            timestamp: new Date(Date.now() + 7000),
            update: 'Still not sure...',
            type: UpdateType.Update,
          },
          {
            timestamp: new Date(Date.now() + 6000),
            type: UpdateType.Investigating,
            update: 'Situation is being investigated',
          },
        ]}
      />
    </div>
  );
};

export default {
  title: 'Status Page/Incident Timeline',
  component: IncidentTimeline,
};
