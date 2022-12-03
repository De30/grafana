import { css, cx } from '@emotion/css';
import React from 'react';

import {
  DataCatalogueItem,
  DataCatalogueItemAttribute,
  GrafanaTheme2,
  IconName,
  isDataCatalogueFolder,
  IsDataCatalogueItemAttributeIcon,
  IsDataCatalogueItemAttributeTag,
} from '@grafana/data';
import { Icon, IconButton, Tag, useStyles2 } from '@grafana/ui';

type Props = {
  item: DataCatalogueItem;
  expand: () => void;
  collapse: () => void;
  expanded: boolean;
  isSelected: boolean;
  setSelectedItem: (item: DataCatalogueItem) => void;
};

const getStyles = (theme: GrafanaTheme2) => ({
  line: css`
    height: 25px;
    display: flex;
  `,
  lineElement: css`
    align-self: center;
    padding-right: 5px;
  `,
  selected: css``,
  notSelected: css`
    opacity: 0.8;
  `,
});

export const DataCatalogueItemLineRenderer = (props: Props) => {
  const { item, expand, expanded, setSelectedItem, isSelected, collapse } = props;

  const isFolder = isDataCatalogueFolder(props.item);

  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.line, isSelected ? styles.selected : styles.notSelected)}>
      {isFolder ? (
        <IconButton
          className={styles.lineElement}
          variant="secondary"
          size="sm"
          name={expanded ? 'folder-open' : 'folder'}
          onClick={() => (expanded ? collapse() : expand())}
        />
      ) : (
        <IconButton size="sm" name="info-circle" className={styles.lineElement} />
      )}
      <span
        className={styles.lineElement}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (!expanded) {
            expand();
          }
          setSelectedItem(item);
        }}
      >
        {isSelected ? <b>{item.name}</b> : <span>{item.name}</span>}
      </span>
      {item.attributes &&
        item.attributes.length > 0 &&
        item.attributes.map((attribute: DataCatalogueItemAttribute, index: number) => {
          if (IsDataCatalogueItemAttributeIcon(attribute)) {
            return <Icon key={index} name={attribute.icon as IconName} title={attribute.info} />;
          } else if (IsDataCatalogueItemAttributeTag(attribute)) {
            return <Tag key={index} className={styles.lineElement} name={attribute.tag} />;
          } else {
            return '';
          }
        })}
    </div>
  );
};
