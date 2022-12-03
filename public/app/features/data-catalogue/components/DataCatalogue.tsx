import React, { useEffect, useState } from 'react';

import { DataCatalogueContext, DataCatalogueFolder, DataCatalogueProvider, DataQuery } from '@grafana/data';
import { Modal } from '@grafana/ui';

import { DataCatalogueItemRenderer } from './DataCatalogueItemRenderer';

type Props<TQuery extends DataQuery> = {
  onClose: () => void;
  dataCatalogueProvider: DataCatalogueProvider<TQuery>;
  dataCatalogueContext: Omit<DataCatalogueContext<TQuery>, 'closeDataCatalogue'>;
};

export const DataCatalogue = <TQuery extends DataQuery>(props: Props<TQuery>) => {
  const [root, setRoot] = useState<DataCatalogueFolder | undefined>(undefined);

  useEffect(() => {
    props.dataCatalogueProvider
      .getRootDataCatalogueFolder({ ...props.dataCatalogueContext, closeDataCatalogue: props.onClose })
      .then(setRoot);
  }, []);

  return (
    <Modal title="Data Catalogue" onDismiss={props.onClose} isOpen>
      {root && <DataCatalogueItemRenderer item={root} />}
    </Modal>
  );
};
