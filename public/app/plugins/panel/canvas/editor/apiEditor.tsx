import React, { FC, useCallback } from 'react';
import { InlineField, InlineFieldRow, JSONFormatter, StringValueEditor } from '@grafana/ui';
import { StandardEditorProps, StandardEditorsRegistryItem, StringFieldConfigSettings } from '@grafana/data';

export interface APIEditorConfig {
  endpoint: string;
  data?: string;
}

const dummyStringSettings: StandardEditorsRegistryItem<string, StringFieldConfigSettings> = {
  settings: {},
} as any;

export const APIEditor: FC<StandardEditorProps<APIEditorConfig, any, any>> = (props) => {
  const { value, context, onChange } = props;
  const labelWidth = 9;

  const onEndpointChange = useCallback(
    (endpoint) => {
      onChange({
        ...value,
        endpoint,
      });
    },
    [onChange, value]
  );

  const onDataChange = useCallback(
    (data) => {
      onChange({
        ...value,
        data,
      });
    },
    [onChange, value]
  );

  const renderJSON = (data: string | undefined) => {
    try {
      const json = JSON.parse(data);
      return <JSONFormatter json={json} />;
    } catch (error) {
      return `Invalid JSON provided: ${error.message}`;
    }
  };

  return (
    <>
      <InlineFieldRow>
        <InlineField label={'Endpoint'} labelWidth={labelWidth} grow={true}>
          <StringValueEditor
            context={context}
            value={value?.endpoint}
            onChange={onEndpointChange}
            item={dummyStringSettings}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label={'Data'} labelWidth={labelWidth} grow={true}>
          <StringValueEditor context={context} value={value?.data} onChange={onDataChange} item={dummyStringSettings} />
        </InlineField>
      </InlineFieldRow>
      {renderJSON(value?.data)}
    </>
  );
};
