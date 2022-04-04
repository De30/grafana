import { DataQuery } from '@grafana/data';
import { Icon, IconButton } from '@grafana/ui';
import { useUniqueId } from 'app/plugins/datasource/influxdb/components/useUniqueId';
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

interface Props {
  query: DataQuery;
  index: number;
  onRemove: (index: number) => void;
}
export const ScratchpadItem = ({ query, index, onRemove }: Props) => {
  const id = useUniqueId();

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <div {...provided.dragHandleProps}>
            <Icon name="draggabledots" size="lg" />

            <IconButton name="trash-alt" onClick={() => onRemove(index)} />
          </div>
          <pre>{JSON.stringify(query)}</pre>
        </div>
      )}
    </Draggable>
  );
};
