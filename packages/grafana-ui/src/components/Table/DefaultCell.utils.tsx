import memoizeOne from 'memoize-one';

import { DataFrame, Field, FieldType, getFieldDisplayName } from '@grafana/data';

import { BarGaugeCell } from './BarGaugeCell';
import { DefaultCell } from './DefaultCell';
import { getFooterValue } from './FooterRow';
import { GeoCell } from './GeoCell';
import { ImageCell } from './ImageCell';
import { JSONViewCell } from './JSONViewCell';
import { CellComponent, TableCellDisplayMode, TableFieldOptions, FooterItem, GrafanaTableColumn } from './types';
import { getTextAlign, filterByValue } from './utils';

export function getColumns(
  data: DataFrame,
  availableWidth: number,
  columnMinWidth: number,
  footerValues?: FooterItem[]
): GrafanaTableColumn[] {
  const columns: GrafanaTableColumn[] = [];
  let fieldCountWithoutWidth = 0;

  for (const [fieldIndex, field] of data.fields.entries()) {
    const fieldTableOptions = (field.config.custom || {}) as TableFieldOptions;

    if (fieldTableOptions.hidden) {
      continue;
    }

    if (fieldTableOptions.width) {
      availableWidth -= fieldTableOptions.width;
    } else {
      fieldCountWithoutWidth++;
    }

    const selectSortType = (type: FieldType) => {
      switch (type) {
        case FieldType.number:
          return 'number';
        case FieldType.time:
          return 'basic';
        default:
          return 'alphanumeric-insensitive';
      }
    };

    const Cell = getCellComponent(fieldTableOptions.displayMode, field);
    columns.push({
      Cell,
      id: fieldIndex.toString(),
      field: field,
      Header: getFieldDisplayName(field, data),
      accessor: (row: any, i: number) => {
        return field.values.get(i);
      },
      sortType: selectSortType(field.type),
      width: fieldTableOptions.width,
      minWidth: fieldTableOptions.minWidth ?? columnMinWidth,
      filter: memoizeOne(filterByValue(field)),
      justifyContent: getTextAlign(field),
      Footer: getFooterValue(fieldIndex, footerValues),
    });
  }

  // set columns that are at minimum width
  let sharedWidth = availableWidth / fieldCountWithoutWidth;
  for (let i = fieldCountWithoutWidth; i > 0; i--) {
    for (const column of columns) {
      if (!column.width && column.minWidth > sharedWidth) {
        column.width = column.minWidth;
        availableWidth -= column.width;
        fieldCountWithoutWidth -= 1;
        sharedWidth = availableWidth / fieldCountWithoutWidth;
      }
    }
  }

  // divide up the rest of the space
  for (const column of columns) {
    if (!column.width) {
      column.width = sharedWidth;
    }
    column.minWidth = 50;
  }

  return columns;
}

export function getCellComponent(displayMode: TableCellDisplayMode, field: Field): CellComponent {
  switch (displayMode) {
    case TableCellDisplayMode.ColorText:
    case TableCellDisplayMode.ColorBackground:
      return DefaultCell;
    case TableCellDisplayMode.Image:
      return ImageCell;
    case TableCellDisplayMode.LcdGauge:
    case TableCellDisplayMode.BasicGauge:
    case TableCellDisplayMode.GradientGauge:
      return BarGaugeCell;
    case TableCellDisplayMode.JSONView:
      return JSONViewCell;
  }

  if (field.type === FieldType.geo) {
    return GeoCell;
  }

  // Default or Auto
  if (field.type === FieldType.other) {
    return JSONViewCell;
  }
  return DefaultCell;
}
