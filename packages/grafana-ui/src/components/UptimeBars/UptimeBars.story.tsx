import React from 'react';
import { Story } from '@storybook/react';
import { UptimeBars, UptimeBarsProps, UptimeDailyStatus, UptimeStatus } from './UptimeBars';
import { addDays, subDays } from 'date-fns';

export default {
  title: 'Status Page/Uptime Bars',
  component: UptimeBars,
};

const get90daysOperational = (): UptimeDailyStatus[] => {
  const ninety = Array.from({ length: 90 }, (_, i) => i);
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);

  return ninety.map<UptimeDailyStatus>((daysToAdd) => ({
    status: UptimeStatus.Operational,
    date: addDays(ninetyDaysAgo, daysToAdd),
  }));
};

export const NoIncidents: Story<UptimeBarsProps> = () => (
  <UptimeBars
    componentName="Homepage"
    availability={0.99876}
    dailyStatuses={[
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
    ]}
  />
);

export const WithIncidents: Story<UptimeBarsProps> = () => (
  <UptimeBars
    componentName="Homepage"
    availability={0.99876}
    dailyStatuses={[
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Degraded, timespan: { hours: 0, minutes: 35 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 3, minutes: 18 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 1, minutes: 45 } },
      { date: new Date(), status: UptimeStatus.Operational },
    ]}
  />
);

export const MonthLongEntries: Story<UptimeBarsProps> = () => (
  <UptimeBars
    componentName="Homepage"
    availability={0.99876}
    dailyStatuses={[
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Degraded, timespan: { hours: 0, minutes: 35 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 3, minutes: 18 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 1, minutes: 45 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Degraded, timespan: { hours: 0, minutes: 35 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 3, minutes: 18 } },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Outage, timespan: { hours: 1, minutes: 45 } },
      { date: new Date(), status: UptimeStatus.Operational },
    ]}
  />
);

export const WithUnknownEntries: Story<UptimeBarsProps> = () => (
  <UptimeBars
    componentName="Homepage"
    availability={0.99876}
    dailyStatuses={[
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Unknown },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
      { date: new Date(), status: UptimeStatus.Operational },
    ]}
  />
);

export const NinetyDaysOperational: Story<UptimeBarsProps> = () => (
  <UptimeBars componentName="Homepage" availability={0.99876} dailyStatuses={get90daysOperational()} />
);
