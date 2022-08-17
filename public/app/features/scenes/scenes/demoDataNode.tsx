// import { getDefaultTimeRange } from '@grafana/data';

import { getDefaultTimeRange } from '@grafana/data';
import { Scene } from '../components/Scene';
import { SceneFlexLayout } from '../components/SceneFlexLayout';
import { SceneToolboxLayout, Orientation } from '../components/SceneToolboxLayout';
import { VizPanel } from '../components/VizPanel';
import { SceneDataProviderNode } from '../core/SceneDataProviderNode';
import { SceneTimeRange } from '../core/SceneTimeRange';
import { SceneEditManager } from '../editor/SceneEditManager';

export function getFlexLayoutTest1(): Scene {
  const scene = new Scene({
    $editor: new SceneEditManager({}),
    title: 'Flex layout test',
    children: [
      new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            children: [
              new SceneToolboxLayout({
                orientation: Orientation.Vertical,
                children: [
                  new SceneTimeRange({
                    range: getDefaultTimeRange(),
                    showInToolbox: true,
                    children: [
                      new SceneDataProviderNode({
                        queries: [
                          {
                            refId: 'A',
                            datasource: {
                              uid: 'gdev-testdata',
                              type: 'testdata',
                            },
                            scenarioId: 'random_walk',
                          },
                        ],
                        children: [
                          new VizPanel({
                            pluginId: 'timeseries',
                            title: 'Title',
                            options: {
                              legend: { displayMode: 'hidden' },
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new SceneToolboxLayout({
                orientation: Orientation.Vertical,
                children: [
                  new SceneTimeRange({
                    range: getDefaultTimeRange(),
                    showInToolbox: true,
                    children: [
                      new SceneDataProviderNode({
                        queries: [
                          {
                            refId: 'B',
                            datasource: {
                              uid: 'gdev-testdata',
                              type: 'testdata',
                            },
                            scenarioId: 'random_walk_table',
                          },
                        ],
                        children: [
                          new VizPanel({
                            pluginId: 'timeseries',
                            title: 'Title',
                            options: {
                              legend: { displayMode: 'hidden' },
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new SceneToolboxLayout({
            orientation: Orientation.Horizontal,
            children: [
              new SceneTimeRange({
                range: getDefaultTimeRange(),
                showInToolbox: true,
                children: [
                  new SceneDataProviderNode({
                    queries: [
                      {
                        refId: 'C',
                        datasource: {
                          uid: 'gdev-testdata',
                          type: 'testdata',
                        },
                        scenarioId: 'usa',
                        usa: { mode: 'timeseries-wide' },
                      },
                    ],
                    children: [
                      new VizPanel({
                        pluginId: 'timeseries',
                        title: 'Title',
                        options: {
                          legend: { displayMode: 'hidden' },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return scene;
}

// export function getScenePanelRepeaterTest(): Scene {
//   const queryRunner = new SceneQueryRunner({
//     queries: [
//       {
//         refId: 'A',
//         datasource: {
//           uid: 'gdev-testdata',
//           type: 'testdata',
//         },
//         seriesCount: 2,
//         alias: '__server_names',
//         scenarioId: 'random_walk',
//       },
//     ],
//   });

//   const scene = new Scene({
//     title: 'Panel repeater test',
//     layout: new ScenePanelRepeater({
//       layout: new SceneFlexLayout({
//         direction: 'column',
//         children: [
//           new SceneFlexLayout({
//             size: { minHeight: 200 },
//             children: [
//               new VizPanel({
//                 pluginId: 'timeseries',
//                 title: 'Title',
//                 options: {
//                   legend: { displayMode: 'hidden' },
//                 },
//               }),
//               new VizPanel({
//                 size: { width: 300 },
//                 pluginId: 'stat',
//                 fieldConfig: { defaults: { displayName: 'Last' }, overrides: [] },
//                 options: {
//                   graphMode: 'none',
//                 },
//               }),
//             ],
//           }),
//         ],
//       }),
//     }),
//     $editor: new SceneEditManager({}),
//     $timeRange: new SceneTimeRange(getDefaultTimeRange()),
//     $data: queryRunner,
//     actions: [
//       new SceneToolbarInput({
//         value: '2',
//         onChange: (newValue) => {
//           queryRunner.setState({
//             queries: [
//               {
//                 ...queryRunner.state.queries[0],
//                 seriesCount: newValue,
//               },
//             ],
//           });
//           queryRunner.runQueries();
//         },
//       }),
//       new SceneTimePicker({}),
//     ],
//   });

//   return scene;
// }
