import { dateMath, dateTimeParse, isDateTime, rangeUtil, TimeRange, TimeZone } from '@grafana/data';

export function isValid(value: string, roundUp?: boolean, timeZone?: TimeZone): boolean {
  if (isDateTime(value)) {
    return value.isValid();
  }

  if (dateMath.isMathString(value)) {
    return dateMath.isValid(value);
  }

  const parsed = dateTimeParse(value, { roundUp, timeZone });
  return parsed.isValid();
}

export function formattedRange(value: TimeRange, timeZone?: TimeZone) {
  const adjustedTimeRange = {
    to: dateMath.isMathString(value.raw.to) ? value.raw.to : value.to,
    from: dateMath.isMathString(value.raw.from) ? value.raw.from : value.from,
  };
  return rangeUtil.describeTimeRange(adjustedTimeRange, timeZone);
}
