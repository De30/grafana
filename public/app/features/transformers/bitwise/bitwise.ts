import { map } from 'rxjs/operators';

import {
  ArrayVector,
  DataFrame,
  DataTransformerID,
  Field,
  FieldType,
  SynchronousDataTransformerInfo,
} from '@grafana/data';

export enum BitwiseOp {
  COUNT_BY_BIT = 'count-by-bit',
}

export interface BitwiseTransformOptions {
  field?: string; // All numbers
  op: BitwiseOp;
  removeZeros?: boolean;
}

export const bitwiseTransformer: SynchronousDataTransformerInfo<BitwiseTransformOptions> = {
  id: DataTransformerID.bitwise,
  name: 'Bitwise operations',
  description: 'Flatten labeled results into a table joined by labels',
  defaultOptions: {},

  operator: (options) => (source) => source.pipe(map((data) => bitwiseTransformer.transformer(options)(data))),

  transformer: (options: BitwiseTransformOptions) => {
    return (data: DataFrame[]) => {
      if (!data || !data.length) {
        return data;
      }
      return [doBitwiseOperation(options, data)];
    };
  },
};

export function doBitwiseOperation(options: BitwiseTransformOptions, data: DataFrame[]): DataFrame {
  const numbers: Field[] = [];
  for (const frame of data) {
    for (const field of frame.fields) {
      if (field.type === FieldType.number) {
        numbers.push(field);
      }
    }
  }

  if (!numbers.length) {
    return getErrorFrame('No numeric fields');
  }

  const bitsize = 32;
  const vals = new Array(bitsize).fill(0);
  for (let i = 0; i < bitsize; i++) {
    const bit = Math.pow(2, i);
    for (const field of numbers) {
      for (const val of field.values.toArray()) {
        if (bit & val) {
          vals[i]++;
        }
      }
    }
  }

  const frame: DataFrame = {
    fields: [],
    length: 1,
  };
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (options.removeZeros && !v) {
      continue;
    }
    frame.fields.push({
      name: `${i}`,
      type: FieldType.number,
      config: {},
      values: new ArrayVector([v]),
    });
  }
  return frame;
}

function getErrorFrame(text: string): DataFrame {
  return {
    meta: {
      notices: [{ severity: 'error', text }],
    },
    fields: [{ name: 'Error', type: FieldType.string, config: {}, values: new ArrayVector([text]) }],
    length: 0,
  };
}
