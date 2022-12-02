import React, { useEffect, useState } from 'react';

import { DataCatalogueFolder, DataCatalogueProvider } from '@grafana/data';
import { Modal } from '@grafana/ui';

import { DataCatalogueItemRenderer } from './DataCatalogueItemRenderer';

type Props = {
  onClose: () => void;
  dataCatalogueProvider: DataCatalogueProvider;
};

export const DataCatalogue = (props: Props) => {
  const [root, setRoot] = useState<DataCatalogueFolder | undefined>(undefined);

  useEffect(() => {
    props.dataCatalogueProvider.getRootDataCatalogueFolder().then(setRoot);
  }, []);

  return (
    <Modal title="Data Catalogue" onDismiss={props.onClose} isOpen>
      {root && <DataCatalogueItemRenderer item={root} />}
    </Modal>
  );
};
