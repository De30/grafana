import DataEditor, { GridCell, Item, GridColumn, GridCellKind, EditableGridCell } from '@glideapps/glide-data-grid';
import React, { useEffect, useRef, useState } from 'react';

import { ArrayVector, DataFrame, DataFrameJSON, dataFrameToJSON, Field, FieldType, MutableDataFrame, PanelProps } from '@grafana/data';
// eslint-disable-next-line import/order
import { useTheme2 } from '@grafana/ui';

import '@glideapps/glide-data-grid/dist/index.css';

import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { GrafanaQuery, GrafanaQueryType } from 'app/plugins/datasource/grafana/types';

import { PanelOptions } from './models.gen';


interface Props extends PanelProps<PanelOptions> {}

export const DataGridPanel: React.FC<Props> = ({ options, data, id, width, height }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [gridData, setGridData] = useState<DataFrame | null>(data.series[0]);

  const theme = useTheme2();
  const gridTheme = {
    accentColor: theme.colors.primary.main,
    accentFg: theme.colors.secondary.main,
    textDark: theme.colors.text.primary,
    textMedium: theme.colors.text.primary,
    textLight: theme.colors.text.primary,
    textBubble: theme.colors.text.primary,
    textHeader: theme.colors.text.primary,
    bgCell: theme.colors.background.primary,
    bgCellMedium: theme.colors.background.primary,
    bgHeader: theme.colors.background.secondary,
    bgHeaderHasFocus: theme.colors.background.secondary,
    bgHeaderHovered: theme.colors.background.secondary,
  };

  useEffect(() => {
    if (!gridData) {
      return;
    }

    const panelModel = getDashboardSrv().getCurrent()?.getPanelById(id);

    if (panelModel) {
      console.log('Updating panel model', gridData);

      const grafanaDS = {
        type: 'grafana',
        uid: 'grafana',
      };

      const snapshot: DataFrameJSON[] = [dataFrameToJSON(gridData)];

      const query = {
        refId: 'A',
        queryType: GrafanaQueryType.Snapshot,
        snapshot,
        datasource: grafanaDS,
      } as GrafanaQuery;

      panelModel.updateQueries({
        dataSource: grafanaDS,
        queries: [query],
      })

      panelModel.refresh();
    }
  }, [gridData, id]);

  // useEffect(() => {
  //   if (!options.usePanelData) {
  //     setGridData(null);
  //     return;
  //   } else {
  //     if (gridData && gridData.length) {
  //       return;
  //     }
  //   }

  //   const datagridDF: DataFrame[] = [];

  //   if (!data.series[0]) {
  //     throw new Error('OH NO 3');
  //   }

  //   data.series[0].fields.forEach((field) => {
  //     datagridData.push({
  //       name: field.name,
  //       values: field.values.toArray(),
  //     });
  //   });

  //   setGridData(datagridData);
  // }, [data.series, gridData.length, id, options.usePanelData]);

  const getCorrectData = (): DataFrame => {
    if (gridData) {
      return gridData;
    }

    return data.series[0];
  };

  const getColumns = (): GridColumn[] => {
    const frame = getCorrectData();

    //TODO getDisplayName might be better, also calculate width dynamically
    return frame.fields.map((f) => ({ title: f.name, width: f.type === FieldType.string ? 100 : 50 }));
  };

  const getCellContent = ([col, row]: Item): GridCell => {
    const frame = getCorrectData();
    const field: Field = frame.fields[col];

    if (!field) {
      throw new Error('OH NO');
    }

    const value = field.values.get(row);

    if (value === undefined || value === null) {
      throw new Error('OH NO 2');
    }

    //TODO there is an error with number gridcells when opening the overlay and editing. so I ignored and made everything text for now

    return {
      kind: GridCellKind.Text,
      data: value,
      allowOverlay: true,
      readonly: false,
      displayData: value.toString(),
    };

    // switch (field.type) {
    //   case FieldType.number:
    //     return {
    //       kind: GridCellKind.Number,
    //       data: value.toString(),
    //       allowOverlay: true,
    //       readonly: false,
    //       displayData: value.toString(),
    //     };
    //   case FieldType.time:
    //     return {
    //       kind: GridCellKind.Text,
    //       data: value,
    //       allowOverlay: true,
    //       readonly: false,
    //       displayData: new Date(value).toTimeString(),
    //     };
    //   case FieldType.string:
    //     return {
    //       kind: GridCellKind.Text,
    //       data: value,
    //       allowOverlay: true,
    //       readonly: false,
    //       displayData: value.toString(),
    //     };
    //   default:
    //     //TODO ?????? ^^^^^^
    //     return {
    //       kind: GridCellKind.Text,
    //       data: value,
    //       allowOverlay: true,
    //       readonly: false,
    //       displayData: value.toString(),
    //     };
    // }
  };

  const onCellEdited = (cell: Item, newValue: EditableGridCell) => {
    const frame = getCorrectData();

    const [col, row] = cell;
    const field: Field = frame.fields[col];

    if (!field) {
      throw new Error('OH NO 3');
    }

    const values = field.values.toArray();
    values[row] = newValue.data;
    field.values = new ArrayVector(values);

    if (gridData) {
      const newFrame = new MutableDataFrame(frame);
      const values = newFrame.fields[col].values.toArray();
      values[row] = String(newValue.data) ?? '';
      newFrame.fields[col].values = new ArrayVector(values);

      setGridData(newFrame);
    }
  };

  const createNewCol = () => {
    if (!gridData) {
      return;
    }

    const len = gridData.length ?? 50;

    const newFrame = new MutableDataFrame(gridData);

    const field: Field = {
      name: inputRef.current?.value ?? 'PLACEHOLDER',
      type: FieldType.string,
      config: {},
      values: new ArrayVector(new Array(len).fill(''))
    }

    newFrame.addField(field);

    setGridData(newFrame);
  };

  const createNewRow = () => {
    if (!gridData) {
      return;
    }

    const newFrame = new MutableDataFrame(gridData);

    const fieldNames: string[] = newFrame.fields.map((f) => f.name);

    fieldNames.forEach(fieldName => {
      newFrame.add({ [fieldName]: '' })
    })

    setGridData(newFrame);
  };

  if (!document.getElementById('portal')) {
    const portal = document.createElement('div');
    portal.id = 'portal';
    document.body.appendChild(portal);
  }

  //TODO multiple series support
  const numRows = getCorrectData().length;

  console.log('rerender');
  return (
    <>
      <DataEditor
        getCellContent={getCellContent}
        columns={getColumns()}
        rows={numRows}
        width={'100%'}
        height={'90%'} //omg this is so ugly
        theme={gridTheme}
        onCellEdited={onCellEdited}
      />
      <input type="text" ref={inputRef} />
      <button onClick={() => createNewCol()}>Create new col</button>
      <button onClick={() => createNewRow()}>Create new row</button>
    </>
  );
};
