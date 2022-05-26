import React, { FC, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Select } from '@grafana/ui';
import { getDashboardModel } from 'app/features/dashboard/state/selectors';

import { initDashboard } from '../../../features/dashboard/state/initDashboard';

import { DashboardPickerDTO } from './DashboardPicker';

interface Props {
  dashboard: DashboardPickerDTO;
}

export const PanelPicker: FC<Props> = ({ dashboard }) => {
  const dispatch = useDispatch();
  const dashboardModel = useSelector(getDashboardModel);

  useEffect(() => {
    dispatch(
      initDashboard({
        urlUid: dashboard.uid,
        fixUrl: true,
      })
    );
  }, [dispatch, dashboard]);

  const panels = useMemo(() => {
    return dashboardModel?.panels.map((panel) => ({
      value: panel.id,
      label: panel.title,
    }));
  }, [dashboardModel]);

  return <Select options={panels} onChange={() => {}} />;
};
