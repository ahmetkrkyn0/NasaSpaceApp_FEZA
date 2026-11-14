import { describe, expect, it } from 'vitest';
import { EXAMPLES, eventsEclipseExample, eventsExample, findExampleProblems, findProblems } from './examples';

describe('example responses', () => {
  it('has one file per endpoint plus the eclipse, relay and error examples', () => {
    expect(Object.keys(EXAMPLES)).toHaveLength(14);
  });

  it('passes the run-time contract check: value sets, UTC strings, snake_case names', () => {
    expect(findExampleProblems()).toEqual([]);
  });

  it('reports values outside the contract', () => {
    const bad = structuredClone(eventsExample) as unknown as {
      validity: string;
      events: { utc: string; criterion: string }[];
    };
    bad.validity = 'SYNTH';
    bad.events[0]!.utc = '2026-12-03 10:03';
    bad.events[0]!.criterion = 'centre';
    const problems = findProblems(bad, 'events.json');
    expect(problems).toHaveLength(3);
    expect(problems.join('\n')).toContain('events.json.validity');
    expect(problems.join('\n')).toContain('events.json.events[0].utc');
    expect(problems.join('\n')).toContain('events.json.events[0].criterion');
  });

  it('flags field names that are not snake_case', () => {
    expect(findProblems({ sunElevation: 1 })).toEqual(['$.sunElevation: field name is not snake_case']);
  });
});

describe('reference values in the examples', () => {
  it('events.json carries the T2b Earth set and rise times', () => {
    expect(eventsExample.events.map((e) => [e.type, e.utc, e.criterion])).toEqual([
      ['earthset', '2026-12-03T10:03:00Z', 'center'],
      ['earthrise', '2026-12-11T04:41:00Z', 'center'],
      ['earthset', '2026-12-30T11:02:00Z', 'center'],
    ]);
  });

  it('events.json windows cover 720 hours with Earth hidden 27.7% of the time (T2b)', () => {
    const total = eventsExample.windows.reduce((sum, w) => sum + w.duration_hours, 0);
    const hidden = eventsExample.windows
      .filter((w) => w.kind === 'earth_hidden')
      .reduce((sum, w) => sum + w.duration_hours, 0);
    expect(total).toBeCloseTo(720, 1);
    expect(((hidden / total) * 100).toFixed(1)).toBe('27.7');
  });

  it('events-eclipse.json carries the T5 eclipse', () => {
    expect(eventsEclipseExample.events.map((e) => [e.type, e.utc, e.max_obscured_fraction])).toEqual([
      ['eclipse_start', '2027-02-20T22:09:00Z', 0.343],
      ['eclipse_end', '2027-02-21T00:36:00Z', 0.343],
    ]);
  });
});
