import React from 'react';

import { EditorField, InlineField, InlineFieldProps } from '@grafana/ui';

interface Props extends InlineFieldProps {
  label: string;
  inlineField?: boolean;
  labelWidth?: number;
}

const DEFAULT_LABEL_WIDTH = 18;

export const Field = (props: Props) => {
  const { labelWidth, inlineField, ...remainingProps } = props;

  if (!inlineField) {
    return <EditorField width={labelWidth || DEFAULT_LABEL_WIDTH} {...remainingProps} />;
  } else {
    return <InlineField labelWidth={labelWidth || DEFAULT_LABEL_WIDTH} {...remainingProps} />;
  }
};
