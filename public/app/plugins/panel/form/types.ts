export interface FormValueConfig {
  path: string;
  title?: string; // Override field name
}

export interface FormSectionConfig {
  title?: string;
  description?: string;
  values: FormValueConfig[];
}

export enum TargetType {
  DS = 'ds',
  URL = 'url',
}

export enum SubmitMode {
  Modal = 'modal',
  Immediate = 'immediate',
  Inline = 'inline',
}

export interface FormPanelOptions {
  target: TargetType;
  url?: string;
  id?: string;
  labelWidth: number;

  sections: FormSectionConfig[];
}
