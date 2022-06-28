import { Property } from 'csstype';
import { Row } from 'react-table';

import { Field, FieldType, formattedValueToString, SelectableValue } from '@grafana/data';

import { TableFieldOptions } from './types';

export function getTextAlign(field?: Field): Property.JustifyContent {
  if (!field) {
    return 'flex-start';
  }

  if (field.config.custom) {
    const custom = field.config.custom as TableFieldOptions;

    switch (custom.align) {
      case 'right':
        return 'flex-end';
      case 'left':
        return 'flex-start';
      case 'center':
        return 'center';
    }
  }

  if (field.type === FieldType.number) {
    return 'flex-end';
  }

  return 'flex-start';
}

export function filterByValue(field?: Field) {
  return function (rows: Row[], id: string, filterValues?: SelectableValue[]) {
    if (rows.length === 0) {
      return rows;
    }

    if (!filterValues) {
      return rows;
    }

    if (!field) {
      return rows;
    }

    return rows.filter((row) => {
      if (!row.values.hasOwnProperty(id)) {
        return false;
      }
      const value = rowToFieldValue(row, field);
      return filterValues.find((filter) => filter.value === value) !== undefined;
    });
  };
}

export function calculateUniqueFieldValues(rows: any[], field?: Field) {
  if (!field || rows.length === 0) {
    return {};
  }

  const set: Record<string, any> = {};

  for (let index = 0; index < rows.length; index++) {
    const value = rowToFieldValue(rows[index], field);
    set[value || '(Blanks)'] = value;
  }

  return set;
}

export function rowToFieldValue(row: any, field?: Field): string {
  if (!field || !row) {
    return '';
  }

  const fieldValue = field.values.get(row.index);
  const displayValue = field.display ? field.display(fieldValue) : fieldValue;
  const value = field.display ? formattedValueToString(displayValue) : displayValue;

  return value;
}

export function valuesToOptions(unique: Record<string, any>): SelectableValue[] {
  return Object.keys(unique)
    .reduce((all, key) => all.concat({ value: unique[key], label: key }), [] as SelectableValue[])
    .sort(sortOptions);
}

export function sortOptions(a: SelectableValue, b: SelectableValue): number {
  if (a.label === undefined && b.label === undefined) {
    return 0;
  }

  if (a.label === undefined && b.label !== undefined) {
    return -1;
  }

  if (a.label !== undefined && b.label === undefined) {
    return 1;
  }

  if (a.label! < b.label!) {
    return -1;
  }

  if (a.label! > b.label!) {
    return 1;
  }

  return 0;
}

export function getFilteredOptions(options: SelectableValue[], filterValues?: SelectableValue[]): SelectableValue[] {
  if (!filterValues) {
    return [];
  }

  return options.filter((option) => filterValues.some((filtered) => filtered.value === option.value));
}

export function sortCaseInsensitive(a: Row<any>, b: Row<any>, id: string) {
  return String(a.values[id]).localeCompare(String(b.values[id]), undefined, { sensitivity: 'base' });
}

// sortNumber needs to have great performance as it is called a lot
export function sortNumber(rowA: Row<any>, rowB: Row<any>, id: string) {
  const a = toNumber(rowA.values[id]);
  const b = toNumber(rowB.values[id]);
  return a === b ? 0 : a > b ? 1 : -1;
}

function toNumber(value: any): number {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (typeof value === 'number') {
    return value;
  }

  return Number(value);
}
