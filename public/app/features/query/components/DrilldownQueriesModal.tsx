import { css } from '@emotion/css';
import React, { useState } from 'react';

import { DrilldownDimension, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Field, HorizontalGroup, Icon, Input, Modal, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';

export interface DrilldownQueriesModalProps {
  id: string;
  isOpen: boolean;
  drilldownQueries: any[] | undefined;
  drilldownDimensions: DrilldownDimension[];
  isLocalDrilldown?: boolean;
  renderDrilldownEditor: (arg1: string, arg2: any, arg3: number) => JSX.Element | null;
  onDrillDownQueriesChange: (arg1: string, arg2: object[]) => void;
  onDismiss: () => void;
  onLocalDrilldownChange?: (val: boolean) => void;
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
  onDismiss,
}: DrilldownQueriesModalProps): JSX.Element => {
  const styles = useStyles2(getStyles);
  const title = 'Drilldown queries';
  const [hierarchyScope, setHierarchyScope] = useState(DrilldownHierarchyScope.Dashboard);

  const onAddDrilldownClick = () => {
    if (drilldownQueries !== undefined && drilldownQueries.length === drilldownDimensions.length) {
      return;
    }

    onDrillDownQueriesChange(id, drilldownQueries ? [...drilldownQueries, {}] : [{}]);
  };

  const onDeleteDimension = (index: number) => {
    const newDimensions = drilldownQueries?.filter((item, i) => i !== index);

    onDrillDownQueriesChange(id, newDimensions ? [...newDimensions] : []);
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
        <DrilldownPanelHierarchy onLocalDrilldownDimensionsUpdate={onLocalDrilldownDimensionsUpdate} />
      )}
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    width: 90%;
  `,
});

interface DrilldownPanelHierarchyProps {
  onLocalDrilldownDimensionsUpdate?: (newDimensions: any) => void;
}

const DrilldownPanelHierarchy = ({ onLocalDrilldownDimensionsUpdate }: DrilldownPanelHierarchyProps) => {
  const [hierarchyDimensions, setHierarchyDimensions] = useState<Array<string | null>>([]);

  const onAddPanelDrilldownQuery = () => {
    const newHierarchy = [...hierarchyDimensions, null];

    setHierarchyDimensions(newHierarchy);
  };

  const onDimensionChange = (index: number) => (e: React.FormEvent<HTMLInputElement>) => {
    const nextHierarchy = hierarchyDimensions.slice();

    nextHierarchy[index] = e.currentTarget.value;

    setHierarchyDimensions(nextHierarchy);
  };

  const onSavePanelDimensions = () => {
    if (onLocalDrilldownDimensionsUpdate) {
      onLocalDrilldownDimensionsUpdate(hierarchyDimensions);
    }
  };

  return (
    <>
      <div>
        {hierarchyDimensions.map((dimension, index) => {
          return (
            <Field key={dimension + '_' + index} label="Dimension name">
              <Input required defaultValue={dimension ?? ''} onBlur={onDimensionChange(index)} />
            </Field>
          );
        })}
        <Button variant="primary" icon="plus" onClick={onAddPanelDrilldownQuery}>
          Add drilldown query
        </Button>
      </div>
      <Modal.ButtonRow>
        <Button variant="primary" icon="plus" onClick={onSavePanelDimensions}>
          Save
        </Button>
      </Modal.ButtonRow>
    </>
  );
};
