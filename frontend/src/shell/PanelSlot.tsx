import type { PanelEntry } from '../features/registry';

/** Renders a list of registered panels in order. */
export function PanelSlot({ panels }: { panels: readonly PanelEntry[] }) {
  return (
    <>
      {panels.map(({ id, component: Panel }) => (
        <div key={id} className="panel-host" data-panel={id}>
          <Panel />
        </div>
      ))}
    </>
  );
}
