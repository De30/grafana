import { Scene } from '../components/Scene';

import { getFlexLayoutTest, getScenePanelRepeaterTest } from './demo';
import { getGridLayoutTest } from './grid';
import { getGridWithMultipleTimeRanges } from './gridMultiTimeRange';
import { getMultipleGridLayoutTest } from './gridMultiple';
import { getGridWithMultipleData } from './gridWithMultipleData';
import { getGridWithRowLayoutTest } from './gridWithRow';
import { getNestedScene } from './nested';
import { getQueryVariableDemo } from './queryVariableDemo';
import { getSceneWithRows } from './sceneWithRows';
import { getTransformationsDemo } from './transformations';
import { getVariablesDemo, getVariablesDemoWithAll } from './variablesDemo';

interface SceneDef {
  title: string;
  getScene: (standalone: boolean) => Scene;
}
export function getScenes(): SceneDef[] {
  return [
    { title: 'Flex layout test', getScene: getFlexLayoutTest },
    { title: 'Panel repeater test', getScene: getScenePanelRepeaterTest },
    { title: 'Nested Scene demo', getScene: getNestedScene },
    { title: 'Scene with rows', getScene: getSceneWithRows },
    { title: 'Grid layout test', getScene: getGridLayoutTest },
    { title: 'Grid with row layout test', getScene: getGridWithRowLayoutTest },
    { title: 'Grid with rows and different queries', getScene: getGridWithMultipleData },
    { title: 'Grid with rows and different queries and time ranges', getScene: getGridWithMultipleTimeRanges },
    { title: 'Multiple grid layouts test', getScene: getMultipleGridLayoutTest },
    { title: 'Variables', getScene: getVariablesDemo },
    { title: 'Variables with All values', getScene: getVariablesDemoWithAll },
    { title: 'Query variable', getScene: getQueryVariableDemo },
    { title: 'Transformations demo', getScene: getTransformationsDemo },
  ];
}

const cache: Record<string, { standalone: boolean; scene: Scene }> = {};

export function getSceneByTitle(title: string, standalone = true) {
  if (cache[title]) {
    if (cache[title].standalone === standalone) {
      return cache[title].scene;
    }
  }

  const scene = getScenes().find((x) => x.title === title);

  if (scene) {
    cache[title] = { scene: scene.getScene(standalone), standalone };
  }

  return cache[title].scene;
}
