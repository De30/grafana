import React from 'react';
import { StandardEditorProps } from '@grafana/data';

import { PanelOptions } from '../models.gen';

type apiEditorProps = StandardEditorProps<any, any, PanelOptions>;

export const apiEditor = (props: apiEditorProps) => {
  return <div>Sup</div>;
};
