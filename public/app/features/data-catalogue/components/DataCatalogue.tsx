import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';

import {
  DataCatalogueContext,
  DataCatalogueFolder,
  DataCatalogueItem,
  DataCatalogueProvider,
  DataQuery,
  GrafanaTheme2,
} from '@grafana/data';
import { Modal, useStyles2 } from '@grafana/ui';

import { DataCatalogueItemDetailsRenderer } from './DataCatalogueItemDetailsRenderer';
import { DataCatalogueItemRenderer } from './DataCatalogueItemRenderer';

type Props<TQuery extends DataQuery> = {
  onClose: () => void;
  dataCatalogueProvider: DataCatalogueProvider<TQuery>;
  dataCatalogueContext: Omit<DataCatalogueContext<TQuery>, 'closeDataCatalogue'>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    width: 80vw;
    height: 80vh;
  `,
  container: css`
    display: flex;
    height: 100%;
  `,
  pane: css`
    flex: 1;
    padding: 1rem;
    overflow: scroll;
  `,
});

export const DataCatalogue = <TQuery extends DataQuery>(props: Props<TQuery>) => {
  const [root, setRoot] = useState<DataCatalogueFolder | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<DataCatalogueItem | undefined>(undefined);

  const styles = useStyles2(getStyles);

  useEffect(() => {
    props.dataCatalogueProvider
      .getRootDataCatalogueFolder({ ...props.dataCatalogueContext, closeDataCatalogue: props.onClose })
      .then((item: DataCatalogueFolder) => {
        setRoot(item);
        setSelectedItem(item);
      });
  }, []);

  return (
    <Modal title="Data Catalogue" onDismiss={props.onClose} isOpen className={styles.modal}>
      {root && (
        <div className={styles.container}>
          <div className={styles.pane}>
            <DataCatalogueItemRenderer item={root} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
          </div>
          <div className={styles.pane}>{selectedItem && <DataCatalogueItemDetailsRenderer item={selectedItem} />}</div>
        </div>
      )}
    </Modal>
  );
};
