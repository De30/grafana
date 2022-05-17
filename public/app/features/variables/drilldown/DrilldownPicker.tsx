import React from 'react';

import { JSONFormatter } from '@grafana/ui';

import { VariablePickerProps } from '../pickers/types';
import { DrilldownVariable } from '../types';

export const DrilldownPicker = ({ variable }: VariablePickerProps<DrilldownVariable>) => {
  return <JSONFormatter json={variable} />;
};
