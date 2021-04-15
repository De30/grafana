import React, { FC } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { GraphiteDatasource } from '../datasource';
import { GraphiteOptions, GraphiteQuery } from '../types';
import { TextEditor } from './TextEditor';
import { VisualEditor } from './VisualEditor';

type Props = QueryEditorProps<GraphiteDatasource, GraphiteQuery, GraphiteOptions>;

export const QueryEditor: FC<Props> = ({
  query,
  onChange,
  onRunQuery,
  datasource,
  range,
  data,
  textEditModeEnabled,
}) => {
  console.log('Query', query);
  console.log('Datasource', datasource);
  console.log('Data', data);

  // required by the parser
  query.target = query.target || '';

  const onTextEditorChange = (value: string): void => {
    query.target = value;
    onChange(query);
    onRunQuery();
  };

  return (
    <>
      {textEditModeEnabled ? (
        <TextEditor query={query} onChange={onTextEditorChange}></TextEditor>
      ) : (
        <VisualEditor query={query} datasource={datasource}></VisualEditor>
      )}
    </>
  );
};
