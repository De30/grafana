import React from 'react';

import { PluginState, TransformerRegistryItem, TransformerUIProps } from '@grafana/data';
import { Switch } from '@grafana/ui';

import { bitwiseTransformer, BitwiseTransformOptions } from './bitwise';

export interface Props extends TransformerUIProps<BitwiseTransformOptions> {}

export function BitwiseTransformerEditor({ input, options, onChange }: Props) {
  return (
    <div>
      TODO....
      <Switch
        value={Boolean(options.removeZeros)}
        onChange={(v) => onChange({ ...options, removeZeros: v.currentTarget.checked })}
      />
    </div>
  );
}

export const bitwiseTransformRegistryItem: TransformerRegistryItem<BitwiseTransformOptions> = {
  id: bitwiseTransformer.id,
  editor: BitwiseTransformerEditor,
  transformation: bitwiseTransformer,
  name: bitwiseTransformer.name,
  description: bitwiseTransformer.description,
  state: PluginState.alpha,
};
