import React, { useState } from 'react';

import { AnnotationQuery, getDataSourceRef } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

import { DashboardModel } from '../../state/DashboardModel';
import { AnnotationSettingsEdit, AnnotationSettingsList, newAnnotationName } from '../AnnotationSettings';

interface Props {
  dashboard: DashboardModel;
}

export const AnnotationsSettings: React.FC<Props> = ({ dashboard }) => {
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const onGoBack = () => {
    setEditIdx(null);
  };

  const onNew = () => {
    const newAnnotation: AnnotationQuery = {
      name: newAnnotationName,
      enable: true,
      datasource: getDataSourceRef(getDataSourceSrv().getInstanceSettings(null)!),
      iconColor: 'red',
    };

    dashboard.annotations.list = [...dashboard.annotations.list, { ...newAnnotation }];
    setEditIdx(dashboard.annotations.list.length - 1);
  };

  const onEdit = (idx: number) => {
    setEditIdx(idx);
  };

  const isEditing = editIdx !== null;

  return (
    <>
      {!isEditing && <AnnotationSettingsList dashboard={dashboard} onNew={onNew} onEdit={onEdit} />}
      {isEditing && <AnnotationSettingsEdit dashboard={dashboard} editIdx={editIdx!} />}
    </>
  );
};
