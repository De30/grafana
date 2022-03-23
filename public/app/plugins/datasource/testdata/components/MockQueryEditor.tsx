import React, { useState } from 'react';
import { Alert, CodeEditor } from '@grafana/ui';
import { EditorProps } from '../QueryEditor';
import { isArray } from 'lodash';
import { toDataQueryResponse } from '@grafana/runtime';
import { dataFrameToJSON, toDataFrame, toDataFrameDTO } from '@grafana/data';

export const MockQueryEditor = ({ onChange, query }: EditorProps) => {
  const mockDS = query.mockDS ?? {};

  const onSaveRequest = (v: string) => {
    onChange({ ...query, request: v });
  };

  const onSaveResponse = (v: string) => {
    onChange({ ...query, response: v });
  };

  return (
    <>
      <h1>Request (optional)</h1>
      <CodeEditor
        height={100}
        language="json"
        value={mockDS.request ?? ''}
        onBlur={onSaveRequest}
        onSave={onSaveRequest}
        showMiniMap={false}
        showLineNumbers={false}
      />

      <h1>Server response</h1>
      <CodeEditor
        height={100}
        language="json"
        value={mockDS.server ?? ''}
        onBlur={onSaveResponse}
        onSave={onSaveResponse}
        showMiniMap={true}
        showLineNumbers={true}
      />
    </>
  );
};
