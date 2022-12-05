import { css, cx } from '@emotion/css';
import React from 'react';

import {
  DataCatalogueItem,
  GrafanaTheme2,
  IconName,
  isDataCatalogueFolder,
  IsDataCatalogueItemAttributeIcon,
} from '@grafana/data';
import { IconButton, useStyles2 } from '@grafana/ui';

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
  const icons = (item.attributes || []).filter(IsDataCatalogueItemAttributeIcon);
  const hasCustomIcon = icons.length > 0;
  const icon = icons.length > 0 ? icons[0].icon : isFolder ? 'folder' : 'info-circle';
  const iconExpanded = icons.length > 0 ? icons[0].icon : isFolder ? 'folder-open' : 'info-circle';

  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.line, isSelected ? styles.selected : styles.notSelected)}>
      {isFolder ? (
        <IconButton
          className={styles.lineElement}
          variant={expanded && hasCustomIcon ? 'primary' : 'secondary'}
          size="sm"
          name={(expanded ? iconExpanded : icon) as IconName}
          onClick={() => (expanded ? collapse() : expand())}
        />
      ) : (
        <IconButton size="sm" name={icon as IconName} className={styles.lineElement} />
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
    </div>
  );
};
