import React, { FC, useMemo } from 'react';
import { css } from '@emotion/css';

import { GrafanaRouteComponentProps } from 'app/core/navigation/types';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { useRunner, useSavedStoryboards } from '../hooks';
import { Storyboard, UnevaluatedStoryboardDocument } from '../types';
import { getLocationSrv } from '@grafana/runtime';
import { Page } from 'app/core/components/Page/Page';

import { useObservable } from 'react-use';
import { ShowStoryboardDocumentElementEditor } from '../components/cells/StoryboardElementEditor';
import { ShowStoryboardDocumentElementResult } from '../components/cells/StoryboardElementResult';
import { evaluateDocument } from '../evaluate';
import { CellType } from '../components/cells/CellType';
import { Button, HorizontalGroup, PageToolbar } from '@grafana/ui';

interface StoryboardRouteParams {
  uid: string;
}

/// documents are a simple list of nodes. they can each be documentation, or code. cells can refer to
/// each-other's output, including data and text. some nodes produce realtime data.

const locationSrv = getLocationSrv();

export const StoryboardView: FC<StoryboardRouteParams> = ({ uid }) => {
  const { boards, updateBoard } = useSavedStoryboards();
  const board = boards.find((b) => b.uid === uid) as Storyboard;
  if (board === undefined) {
    locationSrv.update({ path: '/storyboards', partial: true });
    throw new TypeError('board is undefined');
  }

  const { title } = board as Storyboard;

  const runner = useRunner();
  const evaled = useMemo(() => evaluateDocument(runner, board.notebook as UnevaluatedStoryboardDocument), [runner]);
  const evaluation = useObservable(evaled);

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
              <div
                key={m.id}
                className={css`
                  padding-bottom: 50px;
                `}
              >
                <span>{m.type}</span>
                <ShowStoryboardDocumentElementEditor
                  element={m}
                  onUpdate={(newElement) => {
                    let updatedDoc = board;
                    updatedDoc.notebook.elements[index] = newElement;

                    updateBoard(updatedDoc);
                  }}
                />
                <ShowStoryboardDocumentElementResult
                  element={m}
                  context={evaluation?.context}
                  result={evaluation?.context[m.id]}
                />
                <p>
                  Result saved in variable: <CellType element={m} />
                </p>
              </div>
            ))}
          </div>
          <HorizontalGroup wrap>
            <Button icon="plus" variant="secondary">
              Add text cell
            </Button>
            <Button icon="plus" variant="secondary">
              Add query cell
            </Button>
            <Button icon="plus" variant="secondary">
              Add Python cell
            </Button>
            <Button icon="plus" variant="secondary">
              Add CSV cell
            </Button>
          </HorizontalGroup>
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
