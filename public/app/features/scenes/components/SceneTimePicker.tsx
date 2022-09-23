import { RefreshPicker, ToolbarButtonRow } from '@grafana/ui';
import { TimePickerWithHistory } from 'app/core/components/TimePicker/TimePickerWithHistory';
import React from 'react';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneTimeRangeObject } from '../core/SceneTimeRangeObject';
import { SceneComponentProps, SceneParametrizedState } from '../core/types';

type SceneTimePickerState = SceneParametrizedState<{ timeRange: SceneTimeRangeObject }>;

export class SceneTimePicker extends SceneObjectBase<SceneTimePickerState> {
  static Component = SceneTimeRangeRenderer;
}

function SceneTimeRangeRenderer({ model }: SceneComponentProps<SceneTimePicker>) {
  debugger;
  const timeRange = model.getTimeRange();
  const timeRangeState = timeRange.useState();

  return (
    <ToolbarButtonRow>
      <TimePickerWithHistory
        value={timeRangeState.range!}
        onChange={timeRange.onTimeRangeChange}
        timeZone={'browser'}
        fiscalYearStartMonth={0}
        onMoveBackward={() => {}}
        onMoveForward={() => {}}
        onZoom={() => {}}
        onChangeTimeZone={() => {}}
        onChangeFiscalYearStartMonth={() => {}}
      />

      <RefreshPicker onRefresh={timeRange.onRefresh} onIntervalChanged={timeRange.onIntervalChanged} />
    </ToolbarButtonRow>
  );
}
