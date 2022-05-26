import React, { FC, useState } from 'react';

import { Icon, Modal } from '@grafana/ui/src';
import { DashboardPicker, DashboardPickerDTO } from 'app/core/components/Select/DashboardPicker';
import { PanelPicker } from 'app/core/components/Select/PanelPicker';

interface Props {}

export const PanelPickerModal: FC<Props> = () => {
  const [dashboard, setDashboard] = useState<DashboardPickerDTO>();
  const [panel, setPanel] = useState();

  const modalTitle = (
    <div>
      <Icon name="plus" />
      <h3>Connect to panel</h3>
    </div>
  );

  return (
    <Modal title={modalTitle} isOpen={true}>
      <DashboardPicker onChange={(d) => setDashboard(d)} />
      {dashboard && <PanelPicker dashboard={dashboard} />}
    </Modal>
  );
};
