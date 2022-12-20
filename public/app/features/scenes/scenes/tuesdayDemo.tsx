import { Scene, SceneTimePicker, SceneFlexLayout, VizPanel } from '../components';
import { BigText } from '../components/BigText';
import { SceneTimeRange } from '../core/SceneTimeRange';

import { getQueryRunnerWithRandomWalkQuery } from './queries';

export function getTuesdayDemo(): Scene {
  const scene = new Scene({
    title: 'Tuesday demo',
    layout: new SceneFlexLayout({
      direction: 'row',
      children: [
        new VizPanel({
          pluginId: 'timeseries',
          title: 'Requests/s',
        }),
        new SceneFlexLayout({
          direction: 'column',
          size: { width: '20%' },
          children: [
            new BigText({
              text: 'Tuesday demo',
              size: { ySizing: 'content' },
              fontSize: 20,
            }),
            new BigText({
              text: 'Tuesday demo2',
              size: { ySizing: 'content' },
              fontSize: 20,
            }),
            new VizPanel({
              pluginId: 'stat',
              title: 'Last',
              options: {
                graphMode: 'none',
                textMode: 'value',
              },
            }),
          ],
        }),
      ],
    }),
    $timeRange: new SceneTimeRange(),
    $data: getQueryRunnerWithRandomWalkQuery(),
    actions: [new SceneTimePicker({})],
  });

  return scene;
}

// new SceneFlexLayout({
//   direction: 'column',
//   size: { width: '20%' },
//   children: [
//     new BigText({
//       text: 'Tuesday demo',
//       fontSize: 20,
//     }),
//     new VizPanel({
//       pluginId: 'stat',
//       title: 'Last',
//       options: {
//         graphMode: 'none',
//         textMode: 'value',
//       },
//     })
//   ],
// }),

// Starting state

// export function getTuesdayDemo(): Scene {
//   const scene = new Scene({
//     title: 'Tuesday demo',
//     layout: new SceneFlexLayout({
//       direction: 'row',
//       children: [
//         new VizPanel({
//           pluginId: 'timeseries',
//           title: 'Requests/s',
//         }),
//         new VizPanel({
//           pluginId: 'stat',
//           title: 'Last',
//           size: { width: '20%' },
//           options: {
//             graphMode: 'none',
//             textMode: 'value',
//           },
//         }),
//       ],
//     }),
//     $timeRange: new SceneTimeRange(),
//     $data: getQueryRunnerWithRandomWalkQuery(),
//     actions: [new SceneTimePicker({})],
//   });

//   return scene;
// }
