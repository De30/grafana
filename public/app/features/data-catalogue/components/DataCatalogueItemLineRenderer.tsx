import { css, cx } from '@emotion/css';
import React, { useState } from 'react';

import {
  DataCatalogueItem,
  GrafanaTheme2,
  IconName,
  isDataCatalogueFolder,
  IsDataCatalogueItemAttributeIcon,
} from '@grafana/data';
import { IconButton, Input, useStyles2 } from '@grafana/ui';

type Props = {
  item: DataCatalogueItem;
  toggle: () => void;
  expanded: boolean;
  searchTerm: string;
  isSelected: boolean;
  setSelectedItem: (item: DataCatalogueItem) => void;
  setSearchTerm: (term: string) => void;
  showFilter: boolean;
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
  searchInput: css`
    margin-top: -5px;
    width: 200px;
  `,
  searchIcon: css`
    margin-top: 5px;
  `,
});

export const DataCatalogueItemLineRenderer = (props: Props) => {
  const { item, toggle, expanded, setSelectedItem, isSelected, showFilter, searchTerm, setSearchTerm } = props;

  const [showSearchInput, setShowSearchInput] = useState(false);

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
          onClick={toggle}
        />
      ) : (
        <IconButton size="sm" name={icon as IconName} className={styles.lineElement} />
      )}
      <span
        className={styles.lineElement}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          setSelectedItem(item);
        }}
      >
        {isSelected ? <b>{item.name}</b> : <span>{item.name}</span>}
      </span>
      {showFilter && expanded && (
        <>
          {!showSearchInput && (
            <IconButton
              className={styles.searchIcon}
              size="sm"
              name="search"
              onClick={() => setShowSearchInput(true)}
            />
          )}
          {showSearchInput && (
            <Input
              autoFocus={true}
              className={styles.searchInput}
              value={searchTerm}
              placeholder="Search..."
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          )}
        </>
      )}
    </div>
  );
};
