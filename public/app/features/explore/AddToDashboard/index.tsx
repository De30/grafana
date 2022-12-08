import React, { useState } from 'react';

import { Button } from '@grafana/ui';
import { ExploreId, useSelector } from 'app/types';

import { getExploreItemSelector } from '../state/selectors';

import { AddToDashboardModal } from './AddToDashboardModal';

interface Props {
  exploreId: ExploreId;
}

export const AddToDashboard = ({ exploreId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectExploreItem = getExploreItemSelector(exploreId);
  const explorePaneHasQueries = !!useSelector(selectExploreItem)?.queries?.length;

  return (
    <>
      <Button
        icon="apps"
        size="sm"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        aria-label="Add to dashboard"
        disabled={!explorePaneHasQueries}
      >
        Add to dashboard
      </Button>

      {isOpen && <AddToDashboardModal onClose={() => setIsOpen(false)} exploreId={exploreId} />}
    </>
  );
};
