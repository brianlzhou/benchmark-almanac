// GSO (Global Software Optimization). gso-bench.github.io builds its table from assets/leaderboard.json:
// one entry per run with model, scaffold, setting (Opt@1 or Opt@10), reasoning effort and score, the
// percentage of tasks where the agent matched the expert speedup. Opt@1 is the headline; the two Opt@10
// rows are a best-of-ten metric and are left out so the scores stay comparable.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gso-bench.github.io/assets/leaderboard.json';

interface Entry {
  name: string;
  scaffold?: string;
  setting?: string;
  score: number;
  date?: string;
  reasoning_effort?: string | null;
}

const board: Leaderboard = {
  benchmark: 'gso-bench',
  url: 'https://gso-bench.github.io/',
  feed: FEED,
  terms: 'Static JSON on the GSO project site; the GSO repository is MIT-licensed.',
  aliases: {},
  async fetch() {
    const { models } = await fetchJson<{ models: Entry[] }>(FEED);
    return models
      .filter((m) => (m.setting ?? 'Opt@1') === 'Opt@1')
      .map((m) => ({
        model: m.name,
        score: Number(m.score),
        setting: m.reasoning_effort?.toLowerCase() || undefined,
        harness: m.scaffold,
        date: m.date,
      }));
  },
};
export default board;
