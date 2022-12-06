import React, { useCallback, useEffect, useState } from 'react';

import { DataCatalogueItem, isDataCatalogueFolder, IsLazyDataCatalogueFolder } from '@grafana/data';

import { DataCatalogueItemLineRenderer } from './DataCatalogueItemLineRenderer';

type Props = {
  item: DataCatalogueItem;
  setSelectedItem: (item: DataCatalogueItem | undefined) => void;
  selectedItem?: DataCatalogueItem;
};

export const DataCatalogueItemRenderer = (props: Props) => {
  const [children, setChildren] = useState<DataCatalogueItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const { item, setSelectedItem, selectedItem } = props;
  const isSelected = item === selectedItem;

  const toggle = async () => {
    if (!expanded) {
      if (isDataCatalogueFolder(props.item)) {
        if (IsLazyDataCatalogueFolder(props.item)) {
          setChildren([{ name: 'Loading... ' }]);
          await props.item.createItems();
        }
        setExpanded(true);
        setChildren(props.item.items || []);
      }
    } else {
      setSelectedItem(undefined);
      setExpanded(false);
      setChildren([]);
    }
  };

  const selectItem = useCallback(
    (item: DataCatalogueItem | undefined) => {
      if (isSelected && !expanded) {
        toggle();
      }
      setSelectedItem(item);
    },
    [setSelectedItem, expanded, toggle]
  );

  useEffect(() => {
    if (isSelected && !expanded) {
      toggle();
    }
  }, [isSelected, expanded, toggle]);

  return (
    <div>
      <DataCatalogueItemLineRenderer
        item={item}
        setSelectedItem={selectItem}
        isSelected={isSelected}
        toggle={toggle}
        expanded={expanded}
      />
      <div style={{ paddingLeft: '20px' }}>
        {children.map((child, index) => (
          <DataCatalogueItemRenderer
            key={index}
            item={child}
            selectedItem={selectedItem}
            setSelectedItem={selectItem}
          />
        ))}
      </div>
    </div>
  );
};
