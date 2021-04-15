import React from 'react';
import { GraphiteQuery } from '../types';
import { default as GraphiteModel } from '../graphite_query';
import { GraphiteDatasource } from '../datasource';
import { getTemplateSrv } from '@grafana/runtime';
import { SeriesSection } from './SeriesSection';
import { FunctionsSection } from './FunctionsSection';

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
      <SeriesSection model={model} />
      <FunctionsSection model={model} />
    </>
  );
};
