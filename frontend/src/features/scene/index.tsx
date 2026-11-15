import { useScenario } from '../timeline/data';
import { sceneFor } from './media';
import { SceneView } from './SceneView';

/** Surface view panel of the Explore and Classroom doors (issue #80). */
export default function ScenePanel() {
  const { active } = useScenario();
  return <SceneView choice={sceneFor(active)} />;
}
