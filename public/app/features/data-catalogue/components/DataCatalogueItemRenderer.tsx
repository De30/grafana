import React, { useState } from 'react';

import { DataCatalogueItem, isDataCatalogueFolder } from '@grafana/data';
import { Button } from '@grafana/ui';

import { DataCatalogueItemAttributesAndActionsRenderer } from './DataCatalogueItemAttributesAndActionsRenderer';

type Props = {
  item: DataCatalogueItem;
};

export const DataCatalogueItemRenderer = (props: Props) => {
  const [children, setChildren] = useState<DataCatalogueItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const isFolder = isDataCatalogueFolder(props.item);

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
      {isFolder && (
        <Button
          variant="secondary"
          size="sm"
          icon={expanded ? 'arrow-down' : 'arrow-right'}
          onClick={() => (expanded ? collapse() : expand())}
        />
      )}
      {props.item.name}
      {(props.item.attrs || props.item.actions) && <DataCatalogueItemAttributesAndActionsRenderer item={props.item} />}
      <div style={{ paddingLeft: '20px' }}>
        {children.map((child, index) => (
          <DataCatalogueItemRenderer key={index} item={child} />
        ))}
      </div>
    </div>
  );
};
