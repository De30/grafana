import { DataFrame, Field, formatLabels } from '@grafana/data';

export function getFieldMap(data: DataFrame[]): Record<string, Field> {
  const byIds: Record<string, Field> = {};
  for (const frame of data) {
    for (const field of frame.fields) {
      let id = field.name;
      if (field.labels) {
        id += formatLabels(field.labels);
      }
      byIds[id] = field;
    }
  }
  return byIds;
}
