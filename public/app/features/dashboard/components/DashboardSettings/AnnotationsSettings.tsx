import React from 'react';

import { AnnotationQuery, getDataSourceRef } from '@grafana/data';
import { getDataSourceSrv, locationService } from '@grafana/runtime';

import { DashboardModel } from '../../state/DashboardModel';
import { AnnotationSettingsEdit, AnnotationSettingsList, newAnnotationName } from '../AnnotationSettings';

interface Props {
  dashboard: DashboardModel;
  editIndex?: number;
}

export const AnnotationsSettings: React.FC<Props> = ({ dashboard, editIndex }) => {
  const onNew = () => {
    const newAnnotation: AnnotationQuery = {
      name: newAnnotationName,
      enable: true,
      datasource: getDataSourceRef(getDataSourceSrv().getInstanceSettings(null)!),
      iconColor: 'red',
    };

    dashboard.annotations.list = [...dashboard.annotations.list, { ...newAnnotation }];
    locationService.partial({ editIndex: dashboard.annotations.list.length - 1 });
  };

  const onEdit = (idx: number) => {
    locationService.partial({ editIndex: idx });
    //setEditIdx(idx);
  };

  const isEditing = editIndex != null;

  return (
    <>
      {!isEditing && <AnnotationSettingsList dashboard={dashboard} onNew={onNew} onEdit={onEdit} />}
      {isEditing && <AnnotationSettingsEdit dashboard={dashboard} editIdx={editIndex!} />}
    </>
  );
};
