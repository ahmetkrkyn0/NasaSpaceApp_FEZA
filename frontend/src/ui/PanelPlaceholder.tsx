export interface PanelPlaceholderProps {
  /** Panel title as shown in the interface. */
  title: string;
  /** Plan card that fills the panel, for example `F2-C`. */
  planId: string;
  /** GitHub issue number of that plan card. */
  issue: number;
}

/**
 * Reserved space for a panel whose content arrives in a later phase.
 * It shows no numbers, so nothing unverified reaches the screen.
 */
export function PanelPlaceholder({ title, planId, issue }: PanelPlaceholderProps) {
  return (
    <section className="panel-placeholder" aria-label={title}>
      <h2 className="panel-kicker">{title}</h2>
      <p className="panel-placeholder-text">
        Reserved for {title}. Content arrives with {planId} (#{issue}).
      </p>
    </section>
  );
}
