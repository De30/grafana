import React from 'react';
import { default as GraphiteModel } from '../graphite_query';
import { GraphiteDatasource } from '../datasource';
import { SeriesSection } from './SeriesSection';
import { FunctionsSection } from './FunctionsSection';

type Props = {
  model: GraphiteModel;
  datasource: GraphiteDatasource;
};

export const VisualEditor: React.FC<Props> = ({ model, datasource }) => {
  return (
    <>
      <SeriesSection model={model} />
      <FunctionsSection model={model} />
    </>
  );
};
