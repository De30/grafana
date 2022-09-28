import React from 'react';
import { ToolbarButtonRow } from '@grafana/ui';

import { TimePickerWithHistory } from 'app/core/components/TimePicker/TimePickerWithHistory';

import { useTimeRange } from './TimeRangeContext';

export function SceneTimePicker() {
  const { setTimeRange, timeRange } = useTimeRange();

  return (
    <ToolbarButtonRow alignment="right">
      <TimePickerWithHistory
        value={timeRange}
        onChange={setTimeRange}
        timeZone={'browser'}
        fiscalYearStartMonth={0}
        onMoveBackward={() => {}}
        onMoveForward={() => {}}
        onZoom={() => {}}
        onChangeTimeZone={() => {}}
        onChangeFiscalYearStartMonth={() => {}}
      />

      {/* <RefreshPicker onRefresh={timeRange.onRefresh} onIntervalChanged={timeRange.onIntervalChanged} /> */}
    </ToolbarButtonRow>
  );
}
