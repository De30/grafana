import { css, cx } from '@emotion/css';
import { DataQuery, GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { useLocalStorage } from 'react-use';
import { useScratchpad } from '..';
import { EmptyState } from './EmptyState';
import { ScratchpadItem } from './ScratchpadItem';

const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    position: fixed;
    display: flex;
    align-items: end;
    bottom: ${theme.spacing(3)};
    right: -200px;
    z-index: 999;
    transition: ${theme.transitions.create('right', { duration: theme.transitions.duration.enteringScreen })};
  `,
  rootOpen: css`
    right: 0;
  `,
  button: css`
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
    border-right: 0;
    border-radius: ${theme.shape.borderRadius(3)} 0 0 ${theme.shape.borderRadius(3)};
    box-shadow: ${theme.shadows.z1};
    padding: ${theme.spacing(0.5)};
  `,
  chevron: css`
    transition: ${theme.transitions.create('transform', { duration: theme.transitions.duration.enteringScreen })};
  `,
  chevronOpen: css`
    transform: rotate(180deg);
  `,
  dropArea: css`
    position: relative;
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
    border-right: 0;
    border-radius: ${theme.shape.borderRadius(3)} 0 0 0;
    box-shadow: ${theme.shadows.z1};
    min-height: 250px;
    max-height: 90vh;
    width: 200px;
  `,
});

interface Props {
  isDragging: boolean;
}

export const Scratchpad = ({ isDragging }: Props) => {
  const styles = useStyles2(getStyles);
  const [isOpen, setOpen] = useState(false);
  const [items, setItems] = useLocalStorage<DataQuery[]>('grafana.scratchpad', []);

  const onRemove = (index: number) => {
    setItems(items?.slice(0, index).concat(items.slice(index + 1)));
  };

  useScratchpad('scratchpad', {
    getItem(index) {
      return items?.[index];
    },
    onAddItem(index, query) {
      const newItems = [...(items || [])];
      newItems.splice(index, 0, query);
      setItems(newItems);
    },
    onRemoveItem: onRemove,
  });

  return (
    <>
      <div className={cx(styles.root, (isOpen || isDragging) && styles.rootOpen)}>
        <button className={styles.button} onClick={() => setOpen(!isOpen)}>
          <Icon
            name="angle-left"
            size="lg"
            className={cx(styles.chevron, (isOpen || isDragging) && styles.chevronOpen)}
          />
          <Icon name="edit" size="lg" />
        </button>
        <div className={styles.dropArea}>
          <Droppable droppableId="scratchpad">
            {(provided, snapshot) => {
              return (
                <div ref={provided.innerRef} {...provided.droppableProps} data-lol="1">
                  {items?.length ? (
                    items.map((query, i) => {
                      return <ScratchpadItem query={query} index={i} key={i} onRemove={onRemove} />;
                    })
                  ) : (
                    <EmptyState />
                  )}
                  {provided.placeholder}
                </div>
              );
            }}
          </Droppable>
        </div>
      </div>
    </>
  );
};
