import React from 'react';
import { default as GraphiteModel } from '../graphite_query';
import { Button, IconButton, Segment } from '@grafana/ui';
import { noop } from 'rxjs';

type Props = {
  model: GraphiteModel;
};

export const FunctionsSection: React.FC<Props> = ({ model }) => {
  return (
    <div className="gf-form-inline">
      <label className="gf-form-label query-keyword width-9">Functions</label>
      {model.functions.map((func, i) => {
        return <Segment key={i} onChange={noop} value={func.def.name} options={[{ label: 'foo' }, { label: 'bar' }]} />;
      })}
      <Button icon="plus" variant="secondary" />
      <div className="gf-form gf-form--grow">
        <label className="gf-form-label gf-form-label--grow"></label>
      </div>
    </div>
  );
};
