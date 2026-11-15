import { useState } from 'react';
import { percent, siteById } from './data';
import { ART, Illustration, RoleHead } from './parts';

interface Step {
  title: string;
  task: string;
  finding: string;
}

function buildSteps(): Step[] {
  const near = siteById('apollo-11');
  const far = siteById('change-4');
  const pole = siteById('mons-mouton-im2-target');
  return [
    {
      title: 'Look',
      task: `Open ${near.name} on the near side. How much of the month is Earth in the sky?`,
      finding: `Earth is in view ${percent(near.metrics.earth_visible_fraction)} of the month. It hardly moves in the sky.`,
    },
    {
      title: 'Compare',
      task: `Now open ${far.name} on the far side. Ask the same question.`,
      finding: `Earth is in view ${percent(far.metrics.earth_visible_fraction)} of the month. The Moon itself is in the way.`,
    },
    {
      title: 'Explain',
      task: `Try ${pole.name} near the south pole. Why is the answer in between?`,
      finding: `Earth is in view ${percent(pole.metrics.earth_visible_fraction)} of the month. It sits so low that it dips behind the horizon for up to ${(pole.metrics.longest_earth_hidden_hours / 24).toFixed(1)} days.`,
    },
  ];
}

interface Choice {
  label: string;
  correct: boolean;
  feedback: string;
}

function buildChoices(): Choice[] {
  const pole = siteById('mons-mouton-im2-target');
  const near = siteById('apollo-11');
  const far = siteById('change-4');
  const deg = (v: number) => `${v.toFixed(1)}°`;
  return [
    {
      label: deg(pole.metrics.max_sun_elevation_deg),
      correct: true,
      feedback: 'Yes. Near the pole the Sun only skims the horizon, so a hill can shade a lander for days.',
    },
    {
      label: deg(far.metrics.max_sun_elevation_deg),
      correct: false,
      feedback: `That is the highest Sun at ${far.name}, at a middle latitude. Look closer to the pole.`,
    },
    {
      label: deg(near.metrics.max_sun_elevation_deg),
      correct: false,
      feedback: `That is ${near.name}, near the equator, where the Sun passes almost overhead.`,
    },
  ];
}

export function EducatorPage() {
  const steps = buildSteps();
  const choices = buildChoices();
  const [open, setOpen] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const answer = picked === null ? null : choices[picked];
  const pole = siteById('mons-mouton-im2-target');

  return (
    <>
      <RoleHead
        role="educator"
        title="Why can’t a far-side lander call home?"
        lead="One question, three steps and a quick check. About ten minutes with a class."
        cta="Open the live classroom"
      />
      <div className="rp-split">
        <section className="rp-panel" aria-label="Activity">
          <h2>Activity</h2>
          <ol className="rp-steps">
            {steps.map((step, i) => (
              <li key={step.title} className={i === open ? 'rp-step rp-step-open' : 'rp-step'}>
                <button type="button" aria-expanded={i === open} onClick={() => setOpen(i)}>
                  <span className="rp-step-no">{i + 1}</span>
                  <span className="rp-step-title">{step.title}</span>
                  <span className="rp-step-task">{step.task}</span>
                </button>
                {i === open ? <p className="rp-step-finding">{step.finding}</p> : null}
              </li>
            ))}
          </ol>
        </section>
        <section className="rp-panel" aria-label="Picture">
          <Illustration src={ART.earthMoon} label="Illustration, not to scale" className="rp-art-wide" />
          <h2>What to point at</h2>
          <p>
            The Moon keeps the same face towards Earth. A lander on that face always has Earth in its sky; a lander on the other
            face never sees it. Near the poles Earth sits on the horizon, so the ground decides.
          </p>
        </section>
      </div>

      <section className="rp-panel rp-quiz" aria-label="Quick check">
        <h2>Quick check</h2>
        <p>What is the highest the Sun gets at {pole.name} in December 2026?</p>
        <div className="rp-choices" role="group" aria-label="Answers">
          {choices.map((choice, i) => (
            <button
              key={choice.label}
              type="button"
              className={`rp-choice${picked === i ? (choice.correct ? ' rp-choice-right' : ' rp-choice-wrong') : ''}`}
              aria-pressed={picked === i}
              onClick={() => setPicked(i)}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <p className="rp-feedback" role="status">
          {answer ? answer.feedback : 'Pick an answer to see why.'}
        </p>
      </section>
    </>
  );
}
