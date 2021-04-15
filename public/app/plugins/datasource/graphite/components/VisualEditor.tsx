import React from 'react';
import { Segment } from '../../../../../../packages/grafana-ui';
import { noop } from 'rxjs';
import { GraphiteQuery } from '../types';

type Props = {
  query: GraphiteQuery;
};

export const VisualEditor: React.FC<Props> = ({ query }) => {
  return (
    <>
      <div className="gf-form-inline">
        <label className="gf-form-label query-keyword width-9">Series</label>
        <Segment onChange={noop} value="select" options={[{ label: 'foo' }, { label: 'bar' }]} />
        <div className="gf-form gf-form--grow">
          <label className="gf-form-label gf-form-label--grow"></label>
        </div>
      </div>
      <div className="gf-form-inline">
        <label className="gf-form-label query-keyword width-9">Functions</label>
        <Segment onChange={noop} value="select" options={[{ label: 'foo' }, { label: 'bar' }]} />
        <div className="gf-form gf-form--grow">
          <label className="gf-form-label gf-form-label--grow"></label>
        </div>
      </div>
    </>
  );
};
