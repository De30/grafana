import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';

import {
  DataCatalogueContext,
  DataCatalogueItem,
  DataCatalogueProvider,
  DataQuery,
  GrafanaTheme2,
  IsLazyDataCatalogueItem,
} from '@grafana/data';
import { Modal, useStyles2 } from '@grafana/ui';

import { DataCatalogueItemDetailsRenderer } from './DataCatalogueItemDetailsRenderer';
import { DataCatalogueItemRenderer } from './DataCatalogueItemRenderer';

type Props<TQuery extends DataQuery> = {
  onClose: () => void;
  dataCatalogueProvider: DataCatalogueProvider;
  dataCatalogueContext: Omit<DataCatalogueContext, 'closeDataCatalogue'>;
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
  const [root, setRoot] = useState<DataCatalogueItem | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<DataCatalogueItem | undefined>(undefined);

  const styles = useStyles2(getStyles);

  useEffect(() => {
    props.dataCatalogueProvider
      .getRootDataCatalogueItem({ ...props.dataCatalogueContext, closeDataCatalogue: props.onClose })
      .then(async (item: DataCatalogueItem) => {
        setRoot(item);
        if (IsLazyDataCatalogueItem(item)) {
          await item.createAttributes();
        }
        setSelectedItem(item);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title="Data Catalogue" onDismiss={props.onClose} isOpen className={styles.modal}>
      {root && (
        <div className={styles.container}>
          <div className={styles.pane}>
            <DataCatalogueItemRenderer
              item={root}
              selectedItem={selectedItem}
              setSelectedItem={async (item) => {
                if (IsLazyDataCatalogueItem(item)) {
                  await item.createAttributes();
                }
                setSelectedItem(item);
              }}
            />
          </div>
          <div className={styles.pane}>{selectedItem && <DataCatalogueItemDetailsRenderer item={selectedItem} />}</div>
        </div>
      )}
    </Modal>
  );
};
