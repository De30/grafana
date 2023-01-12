import React from 'react';

import { DataTransformerID, TransformerRegistryItem, TransformerUIProps } from '@grafana/data';
import { SqlTransformer, SqlOptions } from '@grafana/data/src/transformations/transformers/sql';

export function SqlTransformerEditor({ input, options, onChange }: TransformerUIProps<SqlOptions>) {
  return <>Sql editor</>;
}

export const SqlTransformRegistryItem: TransformerRegistryItem<SqlOptions> = {
  id: DataTransformerID.sql,
  editor: SqlTransformerEditor,
  transformation: SqlTransformer,
  name: SqlTransformer.name,
  description: SqlTransformer.description,
};
