import React from 'react';
import { TextArea } from '@grafana/ui';
import { GraphiteQuery } from '../types';

type Props = {
  query: GraphiteQuery;
};

export const TextEditor: React.FC<Props> = ({ query }) => {
  return <TextArea defaultValue={query.target}></TextArea>;
};
