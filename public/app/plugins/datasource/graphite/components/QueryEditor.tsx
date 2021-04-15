import React, { FC } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { GraphiteDatasource } from '../datasource';
import { GraphiteOptions, GraphiteQuery } from '../types';
import { TextEditor } from './TextEditor';
import { VisualEditor } from './VisualEditor';
import { default as GraphiteModel } from '../graphite_query';
import { getTemplateSrv } from '@grafana/runtime';

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

  const model = new GraphiteModel(datasource, query, getTemplateSrv());
  model.target.textEditor = textEditModeEnabled;
  model.parseTarget();
  console.log(model);

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
        <VisualEditor model={model} datasource={datasource}></VisualEditor>
      )}
    </>
  );
};
