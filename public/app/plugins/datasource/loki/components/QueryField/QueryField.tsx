import React, { useRef } from 'react';

import { Props as MonacoProps } from './MonacoQueryField';
import { MonacoQueryFieldLazy } from './MonacoQueryFieldLazy';

type Props = Omit<MonacoProps, 'onRunQuery' | 'onBlur'> & {
  onChange: (query: string) => void;
  onRunQuery: () => void;
  runQueryOnBlur: boolean;
};

export const QueryField = (props: Props) => {
  const lastRunValueRef = useRef<string | null>(null);
  const { runQueryOnBlur, onRunQuery, onChange, ...rest } = props;

  const handleRunQuery = (value: string) => {
    lastRunValueRef.current = value;
    onChange(value);
    onRunQuery();
  };

  const handleBlur = (value: string) => {
    if (runQueryOnBlur) {
      // run handleRunQuery only if the current value is different from the last-time-executed value
      if (value !== lastRunValueRef.current) {
        handleRunQuery(value);
      }
    } else {
      onChange(value);
    }
  };

  return <MonacoQueryFieldLazy onRunQuery={handleRunQuery} onBlur={handleBlur} {...rest} />;
};
