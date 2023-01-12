import { map } from 'rxjs/operators';

import { DataFrame, SynchronousDataTransformerInfo } from '../../types';

import { DataTransformerID } from './ids';

export interface SqlOptions {
  query: string;
}

export const SqlTransformer: SynchronousDataTransformerInfo<SqlOptions> = {
  id: DataTransformerID.sql,
  name: 'SQL',
  description: 'Use SQL to tranform your data.',
  defaultOptions: {
    query: '',
  },

  operator: (options, ctx) => (source) => source.pipe(map((data) => SqlTransformer.transformer(options, ctx)(data))),

  transformer: (options: SqlOptions) => {
    return (data: DataFrame[]) => {
      return data;
    };
  },
};
