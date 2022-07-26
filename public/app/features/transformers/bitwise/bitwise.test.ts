import { toDataFrame, FieldType, DataFrame } from '@grafana/data';

import { BitwiseOp, doBitwiseOperation } from './bitwise';

describe('bitwiseTransformer', () => {
  it('Simple', () => {
    const input = [
      toDataFrame({
        fields: [
          { name: 'Time', type: FieldType.time, values: [1, 2, 3] },
          {
            name: 'Value',
            type: FieldType.number,
            values: [1, 0, 0],
          },
        ],
      }),
      toDataFrame({
        fields: [
          { name: 'Time', type: FieldType.time, values: [1, 2, 3] },
          {
            name: 'Value',
            type: FieldType.number,
            values: [1, 0, 0],
          },
        ],
      }),
    ];

    const result = doBitwiseOperation(
      {
        op: BitwiseOp.COUNT_BY_BIT,
        removeZeros: true,
      },
      input
    );
    expect(toRowsSnapshow(result)).toMatchInlineSnapshot();
  });
});

function toRowsSnapshow(frame: DataFrame) {
  const columns = frame.fields.map((f) => f.name);
  const rows = frame.fields[0].values.toArray().map((v, idx) => {
    return frame.fields.map((f) => f.values.get(idx));
  });
  return {
    columns,
    rows,
  };
}
