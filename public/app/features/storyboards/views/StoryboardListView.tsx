import React, { useState } from 'react';
import { Page } from 'app/core/components/Page/Page';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { StoryboardList } from '../components/StoryboardList';
import { useSavedStoryboards } from '../hooks';
import { Button, VerticalGroup } from '@grafana/ui';
import { StoryboardForm } from '../components/StoryboardForm';
import { v4 as uuidv4 } from 'uuid';
import { getLocationSrv } from '@grafana/runtime';
import { UnevaluatedStoryboardDocument } from '../types';
import { DataFrame, FieldType, MutableDataFrame } from '@grafana/data';

const locationSrv = getLocationSrv();

export const StoryboardListView = () => {
  const navModel = useNavModel('storyboards');
  const [isCreatingBoard, setIsCreating] = useState(false);
  const { boards, createBoard, removeBoard } = useSavedStoryboards();

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <VerticalGroup>
          {isCreatingBoard ? (
            <StoryboardForm
              onSubmit={(values) => {
                const uid = uuidv4();
                createBoard({ ...values, uid, notebook: DEFAULT_DOCUMENT });
                //Reroute to /storyboards/uid
                locationSrv.update({
                  partial: true,
                  path: `/storyboards/${uid}`,
                });
              }}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <Button icon="plus" onClick={() => setIsCreating(true)}>
              Create Storyboard
            </Button>
          )}
          <StoryboardList boards={boards} onRemove={(boardId) => removeBoard(boardId)} />
        </VerticalGroup>
      </Page.Contents>
    </Page>
  );
};

const frame = new MutableDataFrame({
  fields: [
    { name: 'Field 1', type: FieldType.number, config: {}, values: [1, 4] },
    { name: 'Field 2', type: FieldType.number, config: {}, values: [2, 5] },
    { name: 'Field 3', type: FieldType.number, config: {}, values: [3, 6] },
  ],
});
const CSVdata = [frame];

export const DEFAULT_DOCUMENT: UnevaluatedStoryboardDocument = {
  status: 'unevaluated',
  elements: [
    // presentational markdown
    { id: 'markdown', type: 'markdown', content: '# This is markdown' },

    // Directly embed csv
    {
      id: 'some_data',
      type: 'csv',
      content: {
        text: '1,2,3\n4,5,6\n',
        data: CSVdata,
      },
    },

    // Fetch data from remote url and expose result
    // { id: 'fetched', type: 'fetch', url: './works.csv' },

    // Perform a query and put data into local context
    {
      id: 'query',
      type: 'query',
      datasource: 'prometheus',
      query: { refId: 'query', expr: 'go_goroutines' },
      timeRange: { from: '2021-07-01T09:00:00', to: '2021-07-01T15:00:00' },
    },
    {
      id: 'query2',
      type: 'query',
      datasource: 'prometheus',
      query: { refId: 'query2', expr: 'prometheus_engine_queries' },
      timeRange: { from: '2021-07-01T09:00:00', to: '2021-07-01T15:00:00' },
    },

    // Show a timeseries
    { id: 'presentation', type: 'timeseries-plot', from: 'query' },

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

export default StoryboardListView;
