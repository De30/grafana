import React, { useEffect, useState } from 'react';

import { DataCatalogueItem, isDataCatalogueFolder } from '@grafana/data';

import { DataCatalogueItemLineRenderer } from './DataCatalogueItemLineRenderer';

type Props = {
  item: DataCatalogueItem;
  setSelectedItem: (item: DataCatalogueItem) => void;
  selectedItem?: DataCatalogueItem;
};

export const DataCatalogueItemRenderer = (props: Props) => {
  const [children, setChildren] = useState<DataCatalogueItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const { item, setSelectedItem, selectedItem } = props;
  const isSelected = item === selectedItem;

  useEffect(() => {
    if (isSelected && !expanded) {
      expand();
    }
  }, [isSelected]);

  const expand = () => {
    if (isDataCatalogueFolder(props.item)) {
      setExpanded(true);
      props.item
        .items()
        .then((children) => {
          if (!children) {
            setChildren([{ name: 'Error while loading catalogue item.' }]);
          } else {
            setChildren(children);
          }
        })
        .catch((error) => {
          setChildren([{ name: 'Error while loading catalogue item. ' + error.message }]);
        });
    }
  };

  const collapse = () => {
    setExpanded(false);
    setChildren([]);
  };

  return (
    <div>
      <DataCatalogueItemLineRenderer
        item={item}
        setSelectedItem={setSelectedItem}
        isSelected={isSelected}
        expand={expand}
        collapse={collapse}
        expanded={expanded}
      />
      <div style={{ paddingLeft: '20px' }}>
        {children.map((child, index) => (
          <DataCatalogueItemRenderer
            key={index}
            item={child}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        ))}
      </div>
    </div>
  );
};
