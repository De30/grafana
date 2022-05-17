import React from 'react';

import { dispatch } from 'app/store/store';

import { VariablePickerProps } from '../pickers/types';
import { DrilldownVariable } from '../types';

import { applyDrillDownDimensions } from './actions';

export const DrilldownPicker = ({ variable }: VariablePickerProps<DrilldownVariable>) => {
  const onClickBreadcrumb = (dimension: string) => {
    const index = variable.current.value.findIndex((item) => item.dimension === dimension);

    const newDimensions = variable.current.value.filter((item, arrayIndex) => arrayIndex < index);

    dispatch(applyDrillDownDimensions(newDimensions));
  };

  return (
    <div>
      {variable.current.value.length !== 0 &&
        variable.current.value
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
