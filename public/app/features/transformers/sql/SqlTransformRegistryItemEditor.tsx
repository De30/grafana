import React, { useCallback } from 'react';

import { DataTransformerID, TransformerRegistryItem, TransformerUIProps } from '@grafana/data';
import { SqlTransformer, SqlOptions } from '@grafana/data/src/transformations/transformers/sql';
import { Field, TextArea } from '@grafana/ui';

export function SqlTransformerEditor({ input, options, onChange }: TransformerUIProps<SqlOptions>) {
  const onQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...options, query: event.target.value });
    },
    [options, onChange]
  );

  return (
    <>
      <Field label="Query">
        <TextArea name="sql" rows={10} onChange={onQueryChange} />
      </Field>
    </>
  );
}

export const SqlTransformRegistryItem: TransformerRegistryItem<SqlOptions> = {
  id: DataTransformerID.sql,
  editor: SqlTransformerEditor,
  transformation: SqlTransformer,
  name: SqlTransformer.name,
  description: SqlTransformer.description,
};
