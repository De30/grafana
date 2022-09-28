import { Scene } from '../components/Scene';
import { getFlexLayoutTest, getScenePanelRepeaterTest } from './demo';
import { getNestedScene } from './nested';
import { getSceneWithRows } from './sceneWithRows';
import { basic } from '../v2/demos';

export function getScenes(): Scene[] {
  return [getFlexLayoutTest(), getScenePanelRepeaterTest(), getNestedScene(), getSceneWithRows(), basic()];
}

const cache: Record<string, Scene> = {};

export function getSceneByTitle(title: string) {
  if (cache[title]) {
    return cache[title];
  }

  const scene = getScenes().find((x) => x.title === title || x.state?.title === title);
  if (scene) {
    cache[title] = scene;
  }

  return scene;
}
