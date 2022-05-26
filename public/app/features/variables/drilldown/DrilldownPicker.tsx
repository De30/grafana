import React from 'react';

import { dispatch } from 'app/store/store';

import { VariablePickerProps } from '../pickers/types';
import { DrilldownVariable } from '../types';

import { applyDrillDownDimensions } from './actions';

export const DrilldownPicker = ({ variable }: VariablePickerProps<DrilldownVariable>) => {
  const dashboardDimensions = variable.current.value['dashboard'];

  if (!dashboardDimensions) {
    return null;
  }

  const onClickBreadcrumb = (dimension: string) => {
    const index = dashboardDimensions.findIndex((item) => item.dimension === dimension);

    const newDimensions = dashboardDimensions.filter((item, arrayIndex) => arrayIndex < index);

    dispatch(
      applyDrillDownDimensions({
        key: 'dashboard',
        value: newDimensions,
      })
    );
  };

  return (
    <div>
      {dashboardDimensions.length !== 0 &&
        dashboardDimensions
          .map((item: { dimension: string; value: string }) => (
            <a onClick={() => onClickBreadcrumb(item.dimension)} key={item.dimension}>
              {item.dimension + ' : ' + item.value}
            </a>
          ))
          .reduce((prev, curr) => (
            <>
              {prev} / {curr}
            </>
          ))}
    </div>
  );
};
