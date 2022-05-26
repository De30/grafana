import React, { FC, useState } from 'react';

import { Button } from '@grafana/ui';

import { PanelPickerModal } from './PanelPickerModal';

interface Props {}

export const ConnectPanel: FC<Props> = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Connect to panel</Button>
      {isModalOpen && <PanelPickerModal />}
    </>
  );
};
