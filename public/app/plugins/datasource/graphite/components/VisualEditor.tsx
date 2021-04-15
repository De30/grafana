import React from 'react';
import { Segment } from '../../../../../../packages/grafana-ui';
import { noop } from 'rxjs';
import { GraphiteQuery } from '../types';
import { default as GraphiteModel } from '../graphite_query';
import { GraphiteDatasource } from '../datasource';
import { getTemplateSrv } from '@grafana/runtime';

type Props = {
  query: GraphiteQuery;
  datasource: GraphiteDatasource;
};

export const VisualEditor: React.FC<Props> = ({ query, datasource }) => {
  const model = new GraphiteModel(datasource, query, getTemplateSrv());
  model.parseTarget();
  console.log(model);

  return (
    <>
      <div className="gf-form-inline">
        <label className="gf-form-label query-keyword width-9">Series</label>
        {model.segments.map((segment, i) => {
          return (
            <Segment key={i} onChange={noop} value={segment.value} options={[{ label: 'foo' }, { label: 'bar' }]} />
          );
        })}
        <div className="gf-form gf-form--grow">
          <label className="gf-form-label gf-form-label--grow"></label>
        </div>
      </div>
      <div className="gf-form-inline">
        <label className="gf-form-label query-keyword width-9">Functions</label>
        <Segment onChange={noop} value="select" options={[{ label: 'foo' }, { label: 'bar' }]} />
        {model.functions.map((func, i) => {
          return (
            <Segment key={i} onChange={noop} value={func.def.name} options={[{ label: 'foo' }, { label: 'bar' }]} />
          );
        })}
        <div className="gf-form gf-form--grow">
          <label className="gf-form-label gf-form-label--grow"></label>
        </div>
      </div>
    </>
  );
};
