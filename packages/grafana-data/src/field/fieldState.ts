import {
  DataFrame,
  Field,
  TIME_SERIES_VALUE_FIELD_NAME,
  FieldType,
  TIME_SERIES_TIME_FIELD_NAME,
  Labels,
} from '../types';

/**
 * Get an appropriate display title
 */
export function getFrameDisplayName(frame: DataFrame, index?: number) {
  if (frame.name) {
    return frame.name;
  }

  // Single field with tags
  const valuesWithLabels: Field[] = [];
  for (const field of frame.fields) {
    if (field.labels && Object.keys(field.labels).length > 0) {
      valuesWithLabels.push(field);
    }
  }

  if (valuesWithLabels.length === 1) {
    return formatLabels(valuesWithLabels[0].labels!);
  }

  // list all the
  if (index === undefined) {
    return frame.fields
      .filter((f) => f.type !== FieldType.time)
      .map((f) => getFieldDisplayName(f, frame))
      .join(', ');
  }

  if (frame.refId) {
    return `Series (${frame.refId})`;
  }

  return `Series (${index})`;
}

export function getFieldDisplayName(field: Field, frame?: DataFrame, allFrames?: DataFrame[]): string {
  const existingTitle = field.state?.displayName;
  const multipleFrames = Boolean(allFrames && allFrames.length > 1);

  if (existingTitle && multipleFrames === field.state?.multipleFrames) {
    return existingTitle;
  }

  const displayName = calculateFieldDisplayName(field, frame, allFrames);
  field.state = field.state || {};
  field.state.displayName = displayName;
  field.state.multipleFrames = multipleFrames;

  return displayName;
}

/**
 * Get an appropriate display name. If the 'displayName' field config is set, use that.
 */
function calculateFieldDisplayName(field: Field, frame?: DataFrame, allFrames?: DataFrame[]): string {
  const hasConfigTitle = field.config?.displayName && field.config?.displayName.length;

  let displayName = hasConfigTitle ? field.config!.displayName! : field.name;

  if (hasConfigTitle) {
    return displayName;
  }

  if (frame && field.config?.displayNameFromDS) {
    return field.config.displayNameFromDS;
  }

  // This is an ugly exception for time field
  // For time series we should normally treat time field with same name
  // But in case it has a join source we should handle it as normal field
  if (field.type === FieldType.time && !field.labels) {
    return displayName ?? TIME_SERIES_TIME_FIELD_NAME;
  }

  let parts: string[] = [];
  let frameNamesDiffer = false;

  if (allFrames && allFrames.length > 1) {
    for (let i = 1; i < allFrames.length; i++) {
      const frame = allFrames[i];
      if (frame.name !== allFrames[i - 1].name) {
        frameNamesDiffer = true;
        break;
      }
    }
  }

  let frameNameAdded = false;
  let labelsAdded = false;

  if (frameNamesDiffer && frame?.name) {
    parts.push(frame.name);
    frameNameAdded = true;
  }

  if (field.name && field.name !== TIME_SERIES_VALUE_FIELD_NAME) {
    parts.push(field.name);
  }

  if (field.labels && frame) {
    let labelInfo = getLabelsInfo(allFrames ?? [frame]);

    if (labelInfo.labelCount === 1) {
      parts.push(field.labels[labelInfo.labelName]);
    } else {
      let allLabels = formatLabels(field.labels, labelInfo);
      if (allLabels) {
        parts.push(allLabels);
        labelsAdded = true;
      }
      labelsAdded = true;
    }
  }

  // if we have not added frame name and no labels, and field name = Value, we should add frame name
  if (frame && !frameNameAdded && !labelsAdded && field.name === TIME_SERIES_VALUE_FIELD_NAME) {
    if (frame.name && frame.name.length > 0) {
      parts.push(frame.name);
      frameNameAdded = true;
    }
  }

  if (parts.length) {
    displayName = parts.join(' ');
  } else if (field.name) {
    displayName = field.name;
  } else {
    displayName = TIME_SERIES_VALUE_FIELD_NAME;
  }

  // Ensure unique field name
  if (displayName === field.name) {
    displayName = getUniqueFieldName(field, frame);
  }

  return displayName;
}

function getUniqueFieldName(field: Field, frame?: DataFrame) {
  let dupeCount = 0;
  let foundSelf = false;

  if (frame) {
    for (let i = 0; i < frame.fields.length; i++) {
      const otherField = frame.fields[i];

      if (field === otherField) {
        foundSelf = true;

        if (dupeCount > 0) {
          dupeCount++;
          break;
        }
      } else if (field.name === otherField.name) {
        dupeCount++;

        if (foundSelf) {
          break;
        }
      }
    }
  }

  if (dupeCount) {
    return `${field.name} ${dupeCount}`;
  }

  return field.name;
}

interface FrameCollectionLabelInfo {
  allLabels: Record<string, Set<string>>;
  labelName: string;
  labelCount: number;
}

/**
 * Checks all data frames and return name of label if there is only one label name in all frames
 */
function getLabelsInfo(frames: DataFrame[]): FrameCollectionLabelInfo {
  const result: FrameCollectionLabelInfo = {
    allLabels: {},
    labelName: '',
    labelCount: 0,
  };

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    for (const field of frame.fields) {
      if (!field.labels) {
        continue;
      }

      // yes this should be in!
      for (const labelKey in field.labels) {
        if (!result.allLabels[labelKey]) {
          result.labelCount += 1;
          result.labelName = labelKey;
          result.allLabels[labelKey] = new Set<string>();
        }

        result.allLabels[labelKey].add(field.labels[labelKey]);
      }
    }
  }

  return result;
}

export function formatLabels(labels: Labels, labelsInfo?: FrameCollectionLabelInfo): string {
  if (!labels || Object.keys(labels).length === 0) {
    return '';
  }

  let keys = Object.keys(labels).sort();
  if (labelsInfo) {
    keys = keys.filter((key) => labelsInfo.allLabels[key].size > 1);
  }

  const selector = keys.map((key) => `${key}="${labels[key]}"`).join(', ');
  if (selector === '') {
    return '';
  }

  return '{' + selector + '}';
}
