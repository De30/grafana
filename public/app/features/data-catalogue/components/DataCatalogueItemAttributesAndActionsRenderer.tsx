import React from 'react';

import { DataCatalogueItem } from '@grafana/data';
import { Button } from '@grafana/ui';

type Props = {
  item: DataCatalogueItem;
};

export const DataCatalogueItemAttributesAndActionsRenderer = (props: Props) => {
  const attributes = props.item.attrs || {};
  const actions = props.item.actions || [];

  return (
    <span>
      {Object.keys(attributes).map((label) => {
        return `| ${label}: ${attributes[label]} |`;
      })}
      {actions.map((action) => {
        return (
          <Button variant="secondary" onClick={action.handler}>
            {action.name}
          </Button>
        );
      })}
    </span>
  );
};
