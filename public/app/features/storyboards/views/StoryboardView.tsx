import React, { FC, useMemo } from 'react';
import { css } from '@emotion/css';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { useRunner, useSavedStoryboards } from '../hooks';
import {
  EvaluatedStoryboardDocument,
  Storyboard,
  StoryboardDocumentElement,
  UnevaluatedStoryboardDocument,
} from '../types';
import { getLocationSrv } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

import { useObservable } from 'react-use';
import { ShowStoryboardDocumentElementEditor } from '../components/cells/StoryboardElementEditor';
import { ShowStoryboardDocumentElementResult } from '../components/cells/StoryboardElementResult';
import { evaluateDocument } from '../evaluate';
import { CellType } from '../components/cells/CellType';
import { Button, ButtonGroup, Card, HorizontalGroup, IconButton, PageToolbar, ValuePicker } from '@grafana/ui';
import { CellTypeIcon } from '../components/CellTypeIcon';

interface StoryboardRouteParams {
  uid: string;
}

/// documents are a simple list of nodes. they can each be documentation, or code. cells can refer to
/// each-other's output, including data and text. some nodes produce realtime data.

const locationSrv = getLocationSrv();

interface StoryboardCellElementProps {
  element: StoryboardDocumentElement;
  index: number;
  board: Storyboard;
  addCellToBoard: (type: string, board: Storyboard, index?: number) => void;
  removeCellFromBoard: (board: Storyboard, index: number) => void;
  updateBoard: (board: Storyboard) => void;
  evaluation: EvaluatedStoryboardDocument;
}

const StoryboardCellElement = ({
  element,
  index,
  board,
  addCellToBoard,
  removeCellFromBoard,
  updateBoard,
  evaluation,
}: StoryboardCellElementProps) => {
  const addCell = (type: string) => () => addCellToBoard(type, board, index + 1);
  return (
    <Card heading={element.id}>
      <Card.Figure>
        <CellTypeIcon type={element.type} aria-hidden />
      </Card.Figure>
      <Card.Meta>
        <div>
          <ShowStoryboardDocumentElementEditor
            element={element}
            context={evaluation?.context}
            onUpdate={(newElement) => {
              let updatedDoc = board;
              updatedDoc.notebook.elements[index] = newElement;

              updateBoard(updatedDoc);
            }}
          />
          <ShowStoryboardDocumentElementResult
            element={element}
            context={evaluation?.context}
            result={evaluation?.context[element.id]}
          />
          {element.type !== 'markdown' && element.type !== 'plaintext' ? (
            <div>
              Result saved in variable: <CellType element={element} />
            </div>
          ) : null}
        </div>
      </Card.Meta>
      <Card.Actions>
        <>
          <div>Add cell below: </div>
          <ButtonGroup key="addCellBelow">
            <HorizontalGroup align="normal" spacing="xs">
              <Button size="sm" variant="secondary" onClick={addCell('markdown')}>
                Markdown
              </Button>
              <Button size="sm" variant="secondary" onClick={addCell('python')}>
                Python
              </Button>
              <Button size="sm" variant="secondary" onClick={addCell('query')}>
                Query
              </Button>
              <Button size="sm" variant="secondary" onClick={addCell('timeseries-plot')}>
                Plot
              </Button>
            </HorizontalGroup>
          </ButtonGroup>
        </>
      </Card.Actions>
      <Card.SecondaryActions>
        <IconButton
          key="delete"
          name="trash-alt"
          tooltip="Delete this cell"
          onClick={() => removeCellFromBoard(board, index)}
        />
      </Card.SecondaryActions>
    </Card>
  );
};

export const StoryboardView: FC<StoryboardRouteParams> = ({ uid }) => {
  const { boards, updateBoard, addCellToBoard, removeCellFromBoard } = useSavedStoryboards();
  const board = boards.find((b) => b.uid === uid) as Storyboard;
  if (board === undefined) {
    locationSrv.update({ path: '/storyboards', partial: true });
    throw new TypeError('board is undefined');
  }

  const { title } = board as Storyboard;

  const runner = useRunner();
  const evaled = useMemo(() => evaluateDocument(runner, board.notebook as UnevaluatedStoryboardDocument), [
    runner,
    board.notebook,
  ]);
  const evaluation = useObservable(evaled);

  const newCellOptions = [
    { label: 'Markdown cell', value: 'markdown' },
    { label: 'Query cell', value: 'query' },
    { label: 'Plot cell', value: 'timeseries-plot' },
    { label: 'Plain text cell', value: 'plaintext' },
    { label: 'Python cell', value: 'python' },
    { label: 'CSV cell', value: 'csv' },
  ];

  return (
    <Page>
      <PageToolbar
        title={`Storyboards / ${title}`}
        onGoBack={() => locationSrv.update({ path: '/storyboards', partial: true })}
      >
        <Button icon="save">Save</Button>
      </PageToolbar>
      <Page.Contents>
        <div>
          <h2>{title}</h2>
          <hr />
          <div
            className={css`
              display: flex;
              flex-direction: column;
            `}
          >
            {evaluation?.elements.map((m, index) => (
              <li key={m.id}>
                <StoryboardCellElement
                  element={m}
                  index={index}
                  board={board}
                  addCellToBoard={addCellToBoard}
                  removeCellFromBoard={removeCellFromBoard}
                  updateBoard={updateBoard}
                  evaluation={evaluation}
                />
              </li>
            ))}
          </div>
          <ValuePicker
            options={newCellOptions}
            label="Add new cell"
            onChange={(value) => addCellToBoard(value.value!, board)}
            isFullWidth={false}
          />
        </div>
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps = (state: StoreState, props: GrafanaRouteComponentProps<StoryboardRouteParams>) => {
  return {
    uid: props.match.params.uid,
  };
};

export default connect(mapStateToProps)(StoryboardView);
