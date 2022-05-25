import React, { useState } from 'react';

import { DrilldownDimension } from '@grafana/data';
import { Button, Field, Input, Modal } from '@grafana/ui';

export interface DrilldownPanelScopeProps {
  id: string;
  drilldownQueries: any[] | undefined;
  drilldownDimensions: DrilldownDimension[];
  onLocalDrilldownDimensionsUpdate?: (newDimensions: any) => void;
  renderDrilldownEditor: (arg1: string, arg2: any, arg3: number) => JSX.Element | null;
  onDrillDownQueriesChange: (arg1: string, arg2: object[]) => void;
}

export const DrilldownPanelScope = ({
  id,
  drilldownQueries,
  drilldownDimensions,
  onLocalDrilldownDimensionsUpdate,
  renderDrilldownEditor,
  onDrillDownQueriesChange,
}: DrilldownPanelScopeProps) => {
  const [hierarchyDimensions, setHierarchyDimensions] = useState<Array<DrilldownDimension | null>>(drilldownDimensions);

  const onAddPanelDrilldownQuery = () => {
    const newHierarchy = [...hierarchyDimensions, null];

    setHierarchyDimensions(newHierarchy);

    if (drilldownQueries !== undefined) {
      return;
    }

    onDrillDownQueriesChange(id, drilldownQueries ? [...drilldownQueries, {}] : [{}]);
  };

  const onDimensionChange = (index: number) => (e: React.FormEvent<HTMLInputElement>) => {
    const nextHierarchy = hierarchyDimensions.slice();

    nextHierarchy[index] = { name: e.currentTarget.value };

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
            <>
              <Field key={dimension + '_' + index} label="Dimension name">
                <Input required defaultValue={dimension ? dimension.name : ''} onBlur={onDimensionChange(index)} />
              </Field>
              {renderDrilldownEditor(id, drilldownQueries ? drilldownQueries[index] : null, index)}
            </>
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
