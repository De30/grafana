import React, { useState } from 'react';

import { DrilldownDimension } from '@grafana/data';

import { DashboardModel } from '../../state/DashboardModel';
import { DrilldownSettingsEdit, DrilldownSettingsList, newDimensionName } from '../DrilldownSettings';

import { DashboardSettingsHeader } from './DashboardSettingsHeader';

interface Props {
  dashboard: DashboardModel;
}

export const DrilldownSettings: React.FC<Props> = ({ dashboard }) => {
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const onGoBack = () => {
    setEditIdx(null);
  };

  const onNew = () => {
    const newDimension: DrilldownDimension = {
      name: newDimensionName,
    };

    console.log(dashboard.drilldownHierarchy);
    dashboard.drilldownHierarchy = [...dashboard.drilldownHierarchy, newDimension];
    setEditIdx(dashboard.drilldownHierarchy.length - 1);
  };

  const onEdit = (idx: number) => {
    setEditIdx(idx);
  };

  const isEditing = editIdx !== null;

  return (
    <>
      <DashboardSettingsHeader title="Drilldown settings" onGoBack={onGoBack} isEditing={isEditing} />
      {!isEditing && <DrilldownSettingsList dashboard={dashboard} onNew={onNew} onEdit={onEdit} />}
      {isEditing && <DrilldownSettingsEdit dashboard={dashboard} editIdx={editIdx!} />}
    </>
  );
};
