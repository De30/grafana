import React from 'react';

import { RefreshPicker, ToolbarButtonRow } from '@grafana/ui';
import { TimePickerWithHistory } from 'app/core/components/TimePicker/TimePickerWithHistory';

import { useTimeRange } from '../context/timeRange';

export interface SceneTimePickerProps {
  hidePicker?: boolean;
}

export function TimePicker({ hidePicker }: SceneTimePickerProps) {
  const {timeRange, setTimeRange} = useTimeRange();

  if (hidePicker) {
    return null;
  }

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
      {/* Figure out how to broadcast a refresh, I don't think it should be time picker 
          Probably, create a global event bus, that support event targeting (by query ID) and broadcasting
      */}
      <RefreshPicker onRefresh={timeRange.onRefresh} onIntervalChanged={timeRange.onIntervalChanged} />
    </ToolbarButtonRow>
  );
}
