import React, { useState } from 'react';

import { DataCatalogueItem, isDataCatalogueFolder } from '@grafana/data';
import { IconButton } from '@grafana/ui';

import { DataCatalogueItemAttributesRenderer } from './DataCatalogueItemAttributesRenderer';

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
        <IconButton
          variant="secondary"
          size="sm"
          name={expanded ? 'arrow-down' : 'arrow-right'}
          onClick={() => (expanded ? collapse() : expand())}
        />
      )}
      {props.item.name}
      {props.item.attributes && props.item.attributes.length > 0 && (
        <DataCatalogueItemAttributesRenderer item={props.item} />
      )}
      <div style={{ paddingLeft: '20px' }}>
        {children.map((child, index) => (
          <DataCatalogueItemRenderer key={index} item={child} />
        ))}
      </div>
    </div>
  );
};
