import React from 'react';

import { TimeRange, isDateTime, toUtc } from '@grafana/data';
import { TimeRangePickerProps, TimeRangePicker } from '@grafana/ui';

import { LocalStorageValueProvider } from '../LocalStorageValueProvider';

const LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';
const FAVORITES_STORAGE_KEY = 'grafana.dashboard.timepicker.favorites';

interface Props extends Omit<TimeRangePickerProps, 'history' | 'theme'> {}
interface FavoritesProps extends Omit<Props, 'favorites' | 'theme'> {}

export const TimePickerWithHistory = (props: Props) => {
  return (
    <LocalStorageValueProvider<TimeRange[]> storageKey={LOCAL_STORAGE_KEY} defaultValue={[]}>
      {(values, onSaveToStore) => {
        return (
          <TimeRangePicker
            {...props}
            history={convertIfJson(values)}
            onChange={(value) => {
              onAppendToHistory(value, values, onSaveToStore);
              props.onChange(value);
            }}
          />
        );
      }}
    </LocalStorageValueProvider>
  );
};

export const TimePickerWithFavorites = (props: FavoritesProps) => {
  return (
    <LocalStorageValueProvider<TimeRange[]> storageKey={FAVORITES_STORAGE_KEY} defaultValue={[]}>
      {(values, onSaveToSTore) => {
        return (
          <TimePickerWithHistory
            {...props}
            favorites={convertIfJson(values)}
            onFavoritesChange={onSaveToSTore}
          ></TimePickerWithHistory>
        );
      }}
    </LocalStorageValueProvider>
  );
};

function convertIfJson(history: TimeRange[]): TimeRange[] {
  return history.map((time) => {
    if (isDateTime(time.from)) {
      return time;
    }

    return {
      from: toUtc(time.from),
      to: toUtc(time.to),
      raw: time.raw,
    };
  });
}

function onAppendToHistory(toAppend: TimeRange, values: TimeRange[], onSaveToStore: (values: TimeRange[]) => void) {
  if (!isAbsolute(toAppend)) {
    return;
  }
  const toStore = limit([toAppend, ...values]);
  onSaveToStore(toStore);
}

function isAbsolute(value: TimeRange): boolean {
  return isDateTime(value.raw.from) || isDateTime(value.raw.to);
}

function limit(value: TimeRange[]): TimeRange[] {
  return value.slice(0, 4);
}
