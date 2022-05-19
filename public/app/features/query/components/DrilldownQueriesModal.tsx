import { css } from '@emotion/css';
import React from 'react';

import { DrilldownDimension, GrafanaTheme2 } from '@grafana/data';
import { Button, HorizontalGroup, Icon, Modal, Tooltip, useStyles2 } from '@grafana/ui';

export interface DrilldownQueriesModalProps {
  id: string;
  isOpen: boolean;
  drilldownQueries: any[] | undefined;
  drilldownDimensions: DrilldownDimension[];
  renderDrilldownEditor: (arg1: string, arg2: any, arg3: number) => JSX.Element | null;
  onDrillDownQueriesChange: (arg1: string, arg2: object[]) => void;
  onDismiss: () => void;
}

export const DrilldownQueriesModal = ({
  id,
  isOpen,
  drilldownQueries,
  drilldownDimensions,
  renderDrilldownEditor,
  onDrillDownQueriesChange,
  onDismiss,
}: DrilldownQueriesModalProps): JSX.Element => {
  const styles = useStyles2(getStyles);
  const title = 'Drilldown queries';

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

  return (
    <Modal className={styles.modal} title={title} isOpen={isOpen} onDismiss={onDismiss}>
      <div>
        {drilldownQueries ? (
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
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    width: 90%;
  `,
});
