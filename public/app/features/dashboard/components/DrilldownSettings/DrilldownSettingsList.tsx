import React, { useState } from 'react';

import { arrayUtils } from '@grafana/data';
import { DeleteButton, IconButton, VerticalGroup } from '@grafana/ui';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';

import { DashboardModel } from '../../state/DashboardModel';
import { ListNewButton } from '../DashboardSettings/ListNewButton';

type Props = {
  dashboard: DashboardModel;
  onNew: () => void;
  onEdit: (idx: number) => void;
};

export const DrilldownSettingsList: React.FC<Props> = ({ dashboard, onNew, onEdit }) => {
  const [dimensions, updateDimensions] = useState(dashboard.drilldownHierarchy.list);

  const onMove = (idx: number, direction: number) => {
    dashboard.drilldownHierarchy.list = arrayUtils.moveItemImmutably(dimensions, idx, idx + direction);
    updateDimensions(dashboard.annotations.list);
  };

  const onDelete = (idx: number) => {
    dashboard.drilldownHierarchy.list = [...dimensions.slice(0, idx), ...dimensions.slice(idx + 1)];
    updateDimensions(dashboard.drilldownHierarchy.list);
  };

  const showEmptyListCTA = dimensions.length === 0;

  return (
    <VerticalGroup>
      {dimensions.length > 0 && (
        <table className="filter-table filter-table--hover">
          <thead>
            <tr>
              <th>Dimension name</th>
              <th colSpan={3}></th>
            </tr>
          </thead>
          <tbody>
            {dashboard.drilldownHierarchy.list.map((dimension, idx) => (
              <tr key={`${dimension.name}-${idx}`}>
                <td className="pointer" onClick={() => onEdit(idx)}>
                  {dimension.name}
                </td>
                <td style={{ width: '1%' }}>
                  {idx !== 0 && (
                    <IconButton
                      surface="header"
                      name="arrow-up"
                      aria-label="arrow-up"
                      onClick={() => onMove(idx, -1)}
                    />
                  )}
                </td>
                <td style={{ width: '1%' }}>
                  {dashboard.drilldownHierarchy.list.length > 1 &&
                  idx !== dashboard.drilldownHierarchy.list.length - 1 ? (
                    <IconButton
                      surface="header"
                      name="arrow-down"
                      aria-label="arrow-down"
                      onClick={() => onMove(idx, 1)}
                    />
                  ) : null}
                </td>
                <td style={{ width: '1%' }}>
                  <DeleteButton
                    size="sm"
                    onConfirm={() => onDelete(idx)}
                    aria-label={`Delete query with title "${dimension.name}"`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showEmptyListCTA && (
        <EmptyListCTA
          onClick={onNew}
          title="There is no drilldown hierarchy set"
          buttonIcon="comment-alt"
          buttonTitle="Add dimension"
          infoBoxTitle="WIP"
          infoBox={{
            __html: `<p>WIP</p>`,
          }}
        />
      )}
      {!showEmptyListCTA && <ListNewButton onClick={onNew}>New drilldown dimension</ListNewButton>}
    </VerticalGroup>
  );
};
