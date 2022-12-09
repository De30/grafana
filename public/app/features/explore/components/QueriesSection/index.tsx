import React, { useState } from 'react';
import { useToggle } from 'react-use';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DataSourceInstanceSettings } from '@grafana/data';
import { DataSourcePicker } from '@grafana/runtime';
import { IconButton, Button } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { contextSrv } from 'app/core/core';
import { supportedFeatures } from 'app/core/history/richHistoryStorageProvider';
import { AccessControlAction, ExploreId, useDispatch, useSelector } from 'app/types';

import { AddToDashboard } from '../../AddToDashboard';
import ExploreQueryInspector from '../../ExploreQueryInspector';
import { ResponseErrorContainer } from '../../ResponseErrorContainer';
import RichHistoryContainer from '../../RichHistory/RichHistoryContainer';
import { PanelContainer } from '../../components/PanelContainer';
import { changeDatasource } from '../../state/datasource';
import { QueryRows } from '../QueryRows';

enum ExploreDrawer {
  RichHistory,
  QueryInspector,
}

interface Props {
  exploreId: ExploreId;

  onAddQueryButtonClick: () => void;
}

export function QueriesSection({
  exploreId,

  onAddQueryButtonClick,
}: Props) {
  const [isOpen, toggleIsOpen] = useToggle(true);
  const richHistoryRowButtonVisible = supportedFeatures().queryHistoryAvailable;
  const isLive = useSelector((state) => state.explore[exploreId]!.isLive);
  const [activeDrawer, setActiveDrawer] = useState<ExploreDrawer>();
  const showExploreToDashboard =
    contextSrv.hasAccess(AccessControlAction.DashboardsCreate, contextSrv.isEditor) ||
    contextSrv.hasAccess(AccessControlAction.DashboardsWrite, contextSrv.isEditor);
  const dispatch = useDispatch();
  const dsRef = useSelector((state) => state.explore[exploreId]!.datasourceInstance?.getRef());
  const {
    config: {
      featureToggles: { exploreMixedDatasource },
    },
  } = useGrafana();

  const onChangeDatasource = async (dsSettings: DataSourceInstanceSettings) => {
    dispatch(changeDatasource(exploreId, dsSettings.uid, { importQueries: true }));
  };

  return (
    <>
      <PanelContainer
        label="Queries"
        collapsible
        isOpen={isOpen}
        onToggle={toggleIsOpen}
        primaryActions={[
          <DataSourcePicker
            key="ds-picker"
            mixed={exploreMixedDatasource}
            onChange={onChangeDatasource}
            current={dsRef}
          />,
        ]}
        secondaryActions={[
          richHistoryRowButtonVisible && (
            <IconButton
              type="button"
              name="history"
              tooltip="Query history"
              key="query-history"
              onClick={() => setActiveDrawer(ExploreDrawer.RichHistory)}
            />
          ),
          <IconButton
            type="button"
            name="info-circle"
            tooltip="Inspector"
            key="inspector"
            variant="secondary"
            onClick={() => setActiveDrawer(ExploreDrawer.QueryInspector)}
          />,
          showExploreToDashboard && <AddToDashboard key="add-to-dashboard" exploreId={exploreId} />,
          <Button
            type="button"
            size="sm"
            tooltip="Add query"
            key="add-query"
            icon="plus"
            disabled={isLive}
            onClick={() => {
              onAddQueryButtonClick();
              toggleIsOpen(true);
            }}
          >
            Add query
          </Button>,
        ].filter(Boolean)}
      >
        <QueryRows exploreId={exploreId} />
        <ResponseErrorContainer exploreId={exploreId} />
      </PanelContainer>

      {activeDrawer === ExploreDrawer.RichHistory && (
        <AutoSizer>
          {({ width }) => (
            <RichHistoryContainer width={width} exploreId={exploreId} onClose={() => setActiveDrawer(undefined)} />
          )}
        </AutoSizer>
      )}

      {activeDrawer === ExploreDrawer.QueryInspector && (
        <AutoSizer>
          {({ width }) => (
            <ExploreQueryInspector exploreId={exploreId} onClose={() => setActiveDrawer(undefined)} width={width} />
          )}
        </AutoSizer>
      )}
    </>
  );
}
