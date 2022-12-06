import React, { useCallback, useEffect, useState } from 'react';

import { DataCatalogueItem, isDataCatalogueFolder, IsLazyDataCatalogueFolder } from '@grafana/data';
import { LinkButton } from '@grafana/ui';

import { DataCatalogueItemLineRenderer } from './DataCatalogueItemLineRenderer';

type Props = {
  item: DataCatalogueItem;
  setSelectedItem: (item: DataCatalogueItem | undefined) => void;
  selectedItem?: DataCatalogueItem;
};

const MAX_CHILDREN = 10;

export const DataCatalogueItemRenderer = (props: Props) => {
  const [children, setChildren] = useState<DataCatalogueItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [showAllChildren, setShowAllChildren] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const serachActive = searchTerm.length >= 3;

  const { item, setSelectedItem, selectedItem } = props;
  const isSelected = item === selectedItem;

  const toggle = async () => {
    if (!expanded) {
      if (isDataCatalogueFolder(props.item)) {
        if (IsLazyDataCatalogueFolder(props.item)) {
          setChildren([{ name: 'Loading... ' }]);
          await props.item.createItems();
        }
        const items = props.item.items || [{ name: 'No items found. ' }];
        setExpanded(true);
        if (items.length > MAX_CHILDREN) {
          setShowAllChildren(false);
          setShowFilter(true);
        }
        setChildren(items || []);
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

  let visibleChildren = children;
  if (serachActive) {
    visibleChildren = children.filter((item) => item.name.includes(searchTerm));
  } else if (!showAllChildren) {
    visibleChildren = children.slice(0, MAX_CHILDREN);
  }
  const allChildren = children.length;

  return (
    <div>
      <DataCatalogueItemLineRenderer
        item={item}
        setSelectedItem={selectItem}
        isSelected={isSelected}
        toggle={toggle}
        expanded={expanded}
        showFilter={showFilter}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
      />
      <div style={{ marginLeft: '20px' }}>
        {visibleChildren.map((child, index) => (
          <DataCatalogueItemRenderer
            key={index}
            item={child}
            selectedItem={selectedItem}
            setSelectedItem={selectItem}
          />
        ))}
        {!showAllChildren && expanded && (
          <div>
            <span>...</span>
            <span>
              Showing {visibleChildren.length} of {allChildren}.{' '}
              <LinkButton
                size="sm"
                onClick={() => {
                  setShowAllChildren(true);
                  setSearchTerm('');
                }}
              >
                Show all
              </LinkButton>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
