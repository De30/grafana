import { css } from '@emotion/css';
import React, { useState } from 'react';

import { DrilldownDimension, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, HorizontalGroup, Icon, Modal, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';

import { DrilldownPanelScope } from './drilldown/DrilldownPanelScope';

export interface DrilldownQueriesModalProps {
  id: string;
  isOpen: boolean;
  drilldownQueries: any[] | undefined;
  drilldownDimensions: DrilldownDimension[];
  renderDrilldownEditor: (arg1: string, arg2: any, arg3: number) => JSX.Element | null;
  onDrillDownQueriesChange: (arg1: string, arg2: object[]) => void;
  hasLocalDrilldownDimensions: () => boolean;
  onDismiss: () => void;
  onLocalDrilldownDimensionsUpdate?: (newDimensions: any) => void;
}

enum DrilldownHierarchyScope {
  Dashboard,
  Panel,
}

export const DrilldownQueriesModal = ({
  id,
  isOpen,
  drilldownQueries,
  drilldownDimensions,
  renderDrilldownEditor,
  onDrillDownQueriesChange,
  onLocalDrilldownDimensionsUpdate,
  hasLocalDrilldownDimensions,
  onDismiss,
}: DrilldownQueriesModalProps): JSX.Element => {
  const styles = useStyles2(getStyles);
  const title = 'Drilldown queries';
  const [hierarchyScope, setHierarchyScope] = useState(
    hasLocalDrilldownDimensions() ? DrilldownHierarchyScope.Panel : DrilldownHierarchyScope.Dashboard
  );

  const onAddDrilldownClick = () => {
    if (drilldownQueries !== undefined && drilldownQueries.length === drilldownDimensions.length) {
      return;
    }

    onDrillDownQueriesChange(id, drilldownQueries ? [...drilldownQueries, {}] : [{}]);
  };

  const onDeleteDimension = (index: number) => {
    const newQueries = drilldownQueries?.filter((item, i) => i !== index);

    onDrillDownQueriesChange(id, newQueries ? [...newQueries] : []);
  };

  const renderEditorHeader = (dimension: string, index: number) => {
    return (
      <>
        <HorizontalGroup justify="space-between">
          <HorizontalGroup align="flex-start">
            <h5>
              Dimension: {dimension}{' '}
              <Tooltip content={'Use ${__drilldown.' + dimension + '} for this dimension.'}>
                <Icon name="info-circle" />
              </Tooltip>
            </h5>
          </HorizontalGroup>
          <HorizontalGroup align="flex-end">
            <Button size="sm" variant="destructive" icon="minus" onClick={() => onDeleteDimension(index)} />
          </HorizontalGroup>
        </HorizontalGroup>
      </>
    );
  };

  const onDimensionsTypeChange = (value: DrilldownHierarchyScope) => {
    setHierarchyScope(value);
    if (onLocalDrilldownDimensionsUpdate) {
      onLocalDrilldownDimensionsUpdate([]);
    }
    onDrillDownQueriesChange(id, []);
  };

  const options: Array<SelectableValue<DrilldownHierarchyScope>> = [
    { label: 'Use Dashboard Hierarchy', value: DrilldownHierarchyScope.Dashboard },
    { label: 'Use Panel Hierarchy', value: DrilldownHierarchyScope.Panel },
  ];

  return (
    <Modal className={styles.modal} title={title} isOpen={isOpen} onDismiss={onDismiss}>
      <RadioButtonGroup value={hierarchyScope} options={options} onChange={onDimensionsTypeChange} />
      {hierarchyScope === DrilldownHierarchyScope.Dashboard && (
        <>
          <div>
            {drilldownQueries !== undefined && drilldownQueries.length > 0 ? (
              <div>
                {drilldownQueries
                  .map((q: any, i: number) => (
                    <>
                      {renderEditorHeader(drilldownDimensions[i].name, i)}
                      {renderDrilldownEditor(id, q, i)}
                    </>
                  ))
                  .reduce((prev, curr) => (
                    <>
                      {prev} <br /> {curr}
                    </>
                  ))}
              </div>
            ) : null}
          </div>
          <Modal.ButtonRow>
            <Button variant="primary" icon="plus" onClick={onAddDrilldownClick}>
              Add drilldown query
            </Button>
            <Button variant="secondary" onClick={onDismiss} fill="outline">
              Close
            </Button>
          </Modal.ButtonRow>
        </>
      )}
      {hierarchyScope === DrilldownHierarchyScope.Panel && (
        <DrilldownPanelScope
          onLocalDrilldownDimensionsUpdate={onLocalDrilldownDimensionsUpdate}
          renderDrilldownEditor={renderDrilldownEditor}
          onDrillDownQueriesChange={onDrillDownQueriesChange}
          id={id}
          drilldownDimensions={drilldownDimensions}
          drilldownQueries={drilldownQueries}
        />
      )}
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    width: 90%;
  `,
});
