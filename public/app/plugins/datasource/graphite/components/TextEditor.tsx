import React from 'react';
import { TextArea } from '@grafana/ui';
import { GraphiteQuery } from '../types';

type Props = {
  query: GraphiteQuery;
  onChange: (query: string) => void;
};

export const TextEditor: React.FC<Props> = ({ query, onChange }) => {
  return <TextArea defaultValue={query.target} onBlur={(e) => onChange(e.currentTarget.value)}></TextArea>;
};
