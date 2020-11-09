import { Field } from '@grafana/data';
import { FormSectionConfig, FormValueConfig } from './types';

export interface FormValue {
  title: string;
  config: FormValueConfig;
  field?: Field; // Linked to the current result (based on path)
  last?: any; // value from the datasource
  edit?: any; // the editing value
  changed?: boolean;
}

export interface FormSection {
  config: FormSectionConfig;
  values: FormValue[];
}
