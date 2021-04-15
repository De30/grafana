import React from 'react';
import { default as GraphiteModel } from '../graphite_query';
import { Segment } from '@grafana/ui';
import { noop } from 'rxjs';

type Props = {
  model: GraphiteModel;
};

export const SeriesSection: React.FC<Props> = ({ model }) => {
  return (
    <div className="gf-form-inline">
      <label className="gf-form-label query-keyword width-9">Series</label>
      {model.segments.map((segment, i) => {
        return <Segment key={i} onChange={noop} value={segment.value} options={[{ label: 'foo' }, { label: 'bar' }]} />;
      })}
      <Segment onChange={noop} value="select metric" options={[{ label: 'foo' }, { label: 'bar' }]} />
      <div className="gf-form gf-form--grow">
        <label className="gf-form-label gf-form-label--grow"></label>
      </div>
    </div>
  );
};
