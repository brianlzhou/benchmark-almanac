// DeepSWE (Datacurve). deepswe.datacurve.ai renders its leaderboard from static artifacts, one per task-set
// version: /artifacts/<version>/leaderboard-live.json, with a row per harness + model + reasoning effort and
// pass_at_1 (attempt pass rate, 0 to 1) as the headline. The page toggles v1.1 (current) and v1; the same
// configurations score differently on the two task sets, so v1 is this id and v1.1 is deepswe-1-1.ts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Row {
  model: string;
  harness?: string;
  reasoning_effort?: string | null;
  pass_at_1?: number;
}

export function makeDeepSwe(benchmark: string, version: string): Leaderboard {
  const feed = `https://deepswe.datacurve.ai/artifacts/${version}/leaderboard-live.json`;
  return {
    benchmark,
    url: 'https://deepswe.datacurve.ai/',
    feed,
    terms: 'Static JSON artifact on the DeepSWE site (robots.txt allows it); the deep-swe repository is Apache-2.0.',
    aliases: {},
    async fetch() {
      const { rows } = await fetchJson<{ rows: Row[] }>(feed);
      return rows
        .filter((r) => typeof r.pass_at_1 === 'number')
        .map((r) => ({
          model: r.model,
          score: r.pass_at_1! * 100,
          setting: r.reasoning_effort?.toLowerCase() || undefined,
          harness: r.harness,
        }));
    },
  };
}

// v1: the task set released with the repository (tag v1.0.0, May 2026).
export default makeDeepSwe('deepswe', 'v1');
