import { Observable, Subscription } from 'rxjs';

import { toDataFrame } from '../../dataframe';
import { FieldType, DataTransformerConfig, DataFrame } from '../../types';
import { mockTransformationsRegistry } from '../../utils/tests/mockTransformationsRegistry';
import { transformDataFrame } from '../transformDataFrame';

import { DataTransformerID } from './ids';
import { SqlTransformer, SqlOptions } from './sql';

function collectObservable(observable: Observable<any>): Promise<DataFrame[]> {
  return new Promise((resolve) => {
    let receivedValue: DataFrame[];
    const subscription = new Subscription();

    subscription.add(
      observable.subscribe({
        next: (value) => {
          receivedValue = value;
        },
        error: (err) => {
          subscription.unsubscribe();
          resolve(err);
        },
        complete: () => {
          subscription.unsubscribe();
          resolve(receivedValue);
        },
      })
    );
  });
}

function applySqlTransformer(input: DataFrame[], options: SqlOptions): Promise<DataFrame[]> {
  return collectObservable(transformDataFrame([{ id: DataTransformerID.sql, options }], input));
}

describe('SQL Transformer', () => {
  beforeAll(() => {
    mockTransformationsRegistry([SqlTransformer]);
  });

  it('should return a list of dataFrames based on queries', async () => {
    const options: SqlOptions = {
      queries: [
        {
          refId: 'output_0',
          sql: ''
        },
        {
          refId: 'output_1',
          sql: ''
        },
        {
          refId: 'output_2',
          sql: ''
        },
      ]
    };

    const output = await applySqlTransformer([], options);

    expect(output).toMatchObject([
      {
        refId: 'output_0',
      },
      {
        refId: 'output_1'
      },
      {
        refId: 'output_2'
      },
    ]);
  });

  it('should be able to run a sql query', async () => {
    const input: DataFrame[] = [
      {
        refId: 'people',
        fields: [
          { name: 'id', type: FieldType.number, values: [1, 2, 3] },
          { name: 'name', type: FieldType.string, values: ['Diane', 'Bob', 'Emma'] },
          { name: 'age', type: FieldType.number, values: [20, 45, 32] }
        ]
      }
    ].map(toDataFrame)

    const options: SqlOptions = {
      queries: [
        {
          refId: 'output',
          sql: 'SELECT age, name, id AS people_id FROM people'
        },
      ]
    };

    const output = await applySqlTransformer(input, options);

    expect(output).toMatchObject([
      {
        refId: 'output',
        fields: [
          { name: 'age', type: FieldType.number, values: [20, 45, 32] },
          { name: 'name', type: FieldType.string, values: ['Diane', 'Bob', 'Emma'] },
          { name: 'people_id', type: FieldType.number, values: [1, 2, 3] }
        ]
      }
    ]);
  });


});
