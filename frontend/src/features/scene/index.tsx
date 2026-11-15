import type { Scenario } from '../../api/types';
import { useScenario } from '../timeline/data';
import { sceneFor, type SceneChoice } from './media';
import { SceneView } from './SceneView';

/** Identity of what the panel shows; a change mounts a fresh view that starts on the poster. */
export function sceneKey(choice: SceneChoice): string {
  if (choice.kind === 'scene') return `scene:${choice.site.site_id}`;
  if (choice.kind === 'unmapped') return `unmapped:${choice.reason}`;
  return choice.kind;
}

/**
 * The view for a scenario. The `key` makes a site change remount the view, so an open
 * "Orbit loop" never carries over to the next site and no video starts by itself.
 */
export function ScenePanelView({ active }: { active: Scenario | null }) {
  const choice = sceneFor(active);
  return <SceneView key={sceneKey(choice)} choice={choice} />;
}

/** Surface view panel of the Explore and Classroom doors (issue #80). */
export default function ScenePanel() {
  const { active } = useScenario();
  return <ScenePanelView active={active} />;
}
