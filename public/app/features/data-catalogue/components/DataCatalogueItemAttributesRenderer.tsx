import React from 'react';

import {
  DataCatalogueItem,
  DataCatalogueItemAttribute,
  IconName,
  IsDataCatalogueItemAttributeAction,
  IsDataCatalogueItemAttributeIcon,
  IsDataCatalogueItemAttributeKeyValue,
} from '@grafana/data';
import { Button, Icon, Tag } from '@grafana/ui';

type Props = {
  item: DataCatalogueItem;
};

export const DataCatalogueItemAttributesRenderer = (props: Props) => {
  const attributes = props.item.attributes || [];

  return (
    <span>
      {attributes.map((attribute: DataCatalogueItemAttribute, index: number) => {
        if (IsDataCatalogueItemAttributeKeyValue(attribute)) {
          return <Tag key={index} name={`${attribute.key}: ${attribute.value}`} />;
        } else if (IsDataCatalogueItemAttributeIcon(attribute)) {
          return <Icon key={index} name={attribute.icon as IconName} title={attribute.info} />;
        } else if (IsDataCatalogueItemAttributeAction(attribute)) {
          return (
            <Button key={index} variant="secondary" onClick={attribute.handler}>
              {attribute.name}
            </Button>
          );
        } else {
          return '';
        }
      })}
    </span>
  );
};
