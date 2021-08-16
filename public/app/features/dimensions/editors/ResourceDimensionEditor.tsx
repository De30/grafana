import React, { FC, useCallback } from 'react';
<<<<<<< HEAD
<<<<<<< HEAD
import {
  FieldNamePickerConfigSettings,
  StandardEditorProps,
  StandardEditorsRegistryItem,
  StringFieldConfigSettings,
} from '@grafana/data';
import { ResourceDimensionConfig, ResourceDimensionMode, ResourceDimensionOptions } from '../types';
import { InlineField, InlineFieldRow, RadioButtonGroup, StringValueEditor } from '@grafana/ui';
import { FieldNamePicker } from '../../../../../packages/grafana-ui/src/components/MatchersUI/FieldNamePicker';
=======
import { FieldNamePickerConfigSettings, StandardEditorProps, StandardEditorsRegistryItem } from '@grafana/data';
import { ResourceDimensionConfig, ResourceDimensionMode, ResourceDimensionOptions } from '../types';
import { InlineField, InlineFieldRow, RadioButtonGroup } from '@grafana/ui';
import { FieldNamePicker } from '../../../../../../../packages/grafana-ui/src/components/MatchersUI/FieldNamePicker';
>>>>>>> 8e965213c5 (more options)
=======
import { FieldNamePickerConfigSettings, StandardEditorProps, StandardEditorsRegistryItem } from '@grafana/data';
import { ResourceDimensionConfig, ResourceDimensionMode, ResourceDimensionOptions } from '../types';
import { InlineField, InlineFieldRow, RadioButtonGroup } from '@grafana/ui';
import { FieldNamePicker } from '../../../../../packages/grafana-ui/src/components/MatchersUI/FieldNamePicker';
>>>>>>> 765023b1ce (move dimensions out of geomap)
import IconSelector from './IconSelector';

const resourceOptions = [
  { label: 'Fixed', value: ResourceDimensionMode.Fixed, description: 'Fixed value' },
  { label: 'Field', value: ResourceDimensionMode.Field, description: 'Use a string field result' },
  //  { label: 'Mapping', value: ResourceDimensionMode.Mapping, description: 'Map the results of a value to an svg' },
];

const dummyFieldSettings: StandardEditorsRegistryItem<string, FieldNamePickerConfigSettings> = {
  settings: {},
} as any;

<<<<<<< HEAD
<<<<<<< HEAD
const dummyImageStringSettings: StandardEditorsRegistryItem<string, StringFieldConfigSettings> = {
  settings: {
    placeholder: 'Enter image URL',
  },
} as any;

export const ResourceDimensionEditor: FC<
  StandardEditorProps<ResourceDimensionConfig, ResourceDimensionOptions, any>
> = (props) => {
=======
export const IconDimensionEditor: FC<StandardEditorProps<ResourceDimensionConfig, ResourceDimensionOptions, any>> = (
  props
) => {
>>>>>>> 8e965213c5 (more options)
=======
export const IconDimensionEditor: FC<StandardEditorProps<ResourceDimensionConfig, ResourceDimensionOptions, any>> = (
  props
) => {
>>>>>>> 765023b1ce (move dimensions out of geomap)
  const { value, context, onChange, item } = props;
  const resourceType = item.settings?.resourceType ?? 'icon';
  const labelWidth = 9;

  const onModeChange = useCallback(
    (mode) => {
      onChange({
        ...value,
        mode,
      });
    },
    [onChange, value]
  );

  const onFieldChange = useCallback(
    (field) => {
      onChange({
        ...value,
        field,
      });
    },
    [onChange, value]
  );

  const onFixedChange = useCallback(
    (fixed) => {
      onChange({
        ...value,
        fixed,
      });
    },
    [onChange, value]
  );

  const mode = value?.mode ?? ResourceDimensionMode.Fixed;

  return (
    <>
      <InlineFieldRow>
        <InlineField label="Source" labelWidth={labelWidth} grow={true}>
          <RadioButtonGroup value={mode} options={resourceOptions} onChange={onModeChange} fullWidth />
        </InlineField>
      </InlineFieldRow>
      {mode !== ResourceDimensionMode.Fixed && (
        <InlineFieldRow>
          <InlineField label="Field" labelWidth={labelWidth} grow={true}>
            <FieldNamePicker
              context={context}
              value={value.field ?? ''}
              onChange={onFieldChange}
              item={dummyFieldSettings}
            />
          </InlineField>
        </InlineFieldRow>
      )}
      {mode === ResourceDimensionMode.Fixed && (
        <InlineFieldRow>
<<<<<<< HEAD
<<<<<<< HEAD
          {resourceType === 'icon' && (
            <InlineField label="Icon" labelWidth={labelWidth} grow={true}>
              <IconSelector value={value?.fixed} onChange={onFixedChange} />
            </InlineField>
          )}
          {resourceType === 'image' && (
            <InlineField label="Image" labelWidth={labelWidth} grow={true}>
              <StringValueEditor
                context={context}
                value={value?.fixed}
                onChange={onFixedChange}
                item={dummyImageStringSettings}
              />
            </InlineField>
          )}
=======
          <InlineField label={resourceType === 'icon' ? 'Icon' : 'Image'} labelWidth={labelWidth} grow={true}>
            <IconSelector value={value?.fixed} onChange={onFixedChange} />
          </InlineField>
>>>>>>> 8e965213c5 (more options)
=======
          <InlineField label={resourceType === 'icon' ? 'Icon' : 'Image'} labelWidth={labelWidth} grow={true}>
            <IconSelector value={value?.fixed} onChange={onFixedChange} />
          </InlineField>
>>>>>>> 765023b1ce (move dimensions out of geomap)
        </InlineFieldRow>
      )}
      {mode === ResourceDimensionMode.Mapping && (
        <InlineFieldRow>
          <InlineField label="Mappings" labelWidth={labelWidth} grow={true}>
            <div>TODO mappings editor!</div>
          </InlineField>
        </InlineFieldRow>
      )}
    </>
  );
};
