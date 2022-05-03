import React, { useState } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Field, Input } from '@grafana/ui';

import { DashboardModel } from '../../state/DashboardModel';

type Props = {
  editIdx: number;
  dashboard: DashboardModel;
};

export const newDimensionName = 'New dimension';

export const DrilldownSettingsEdit: React.FC<Props> = ({ editIdx, dashboard }) => {
  const [dimension, setDimension] = useState(dashboard.drilldownHierarchy[editIdx]);

  const onUpdate = (dimension: any) => {
    const list = [...dashboard.drilldownHierarchy];
    list.splice(editIdx, 1, dimension);
    setDimension(dimension);
    dashboard.drilldownHierarchy = list;
  };

  const onNameChange = (ev: React.FocusEvent<HTMLInputElement>) => {
    onUpdate({
      ...dimension,
      name: ev.currentTarget.value,
    });
  };

  const isNewAnnotation = dimension.name === newDimensionName;

  return (
    <div>
      <Field label="Name">
        <Input
          aria-label={selectors.pages.Dashboard.Settings.Annotations.Settings.name}
          name="name"
          id="name"
          autoFocus={isNewAnnotation}
          value={dimension.name}
          onChange={onNameChange}
          width={50}
        />
      </Field>
    </div>
  );
};

DrilldownSettingsEdit.displayName = 'DrilldownSettingsEdit';
