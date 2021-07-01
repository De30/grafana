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
import { Button, HorizontalGroup } from '@grafana/ui';

interface StoryboardRouteParams {
  uid: string;
}

/// documents are a simple list of nodes. they can each be documentation, or code. cells can refer to
/// each-other's output, including data and text. some nodes produce realtime data.
const document: UnevaluatedStoryboardDocument = {
  title: 'This is the document title',
  status: 'unevaluated',
  elements: [
    // presentational markdown
    { id: 'markdown', type: 'markdown', content: '# This is markdown' },

    // Directly embed csv
    {
      id: 'some_data',
      type: 'csv',
      content: `1,23,4
3,4,1`,
    },

    // Fetch data from remote url and expose result
    // { id: 'fetched', type: 'fetch', url: './works.csv' },

    // Perform a query and put data into local context
    {
      id: 'query',
      type: 'query',
      datasource: 'prometheus',
      query: { refId: 'query', expr: 'go_goroutines' },
      timeRange: { from: '2021-07-01T00:00:00', to: '2021-07-01T09:00:00' },
    },

    // Show a timeseries
    // { id: 'presentation', type: 'timeseries-view', from: 'query' },

    // raw json data
    // {
    //   id: 'rawtime',
    //   type: 'json',
    //   content: [
    //     { time: 1, value: 123 },
    //     { time: 2, value: 124 },
    //   ],
    // },
    //
    {
      id: 'compute1',
      type: 'python',
      script: `from js import some_data;
42 + int(some_data[0][1])`,
    },
    {
      id: 'compute2',
      type: 'python',
      script: `from js import compute1;
compute1 + 42`,
    },
  ],
};

const locationSrv = getLocationSrv();

export const StoryboardView: FC<StoryboardRouteParams> = ({ uid }) => {
  const { boards } = useSavedStoryboards();
  const board = boards.find((b) => b.uid === uid);
  if (!board) {
    locationSrv.update({ path: '/storyboards', partial: true });
  }

  const { title } = board as Storyboard;
  const navModel = {
    main: {
      text: title,
      icon: 'book-open',
    },
    node: {
      text: 'Storyboards',
    },
  };

  const runner = useRunner();
  const evaled = useMemo(() => evaluateDocument(runner, document), [runner]);
  const evaluation = useObservable(evaled);

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <div>
          <h2>{document.title}</h2>
          <hr />
          <div
            className={css`
              display: flex;
              flex-direction: column;
            `}
          >
            {evaluation?.elements.map((m) => (
              <div key={m.id}>
                <CellType element={m} />
                <ShowStoryboardDocumentElementEditor element={m} />
                <ShowStoryboardDocumentElementResult element={m} result={evaluation?.context[m.id]} />
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
