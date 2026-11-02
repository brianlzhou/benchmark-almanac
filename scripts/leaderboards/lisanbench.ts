// LisanBench. lisanbench.com loads data/core.json: per model configuration (one entry per reasoning effort)
// the label, run coverage, token counts and cost, and in "aggregated" the scores. The board's default
// metric is Path Length, `sum_chain_avg` (valid word-chain steps summed over the 50 starting words, averaged
// over 3 trials), which is the score. Every effort is read, with the label's parenthesis ("Opus 5.5
// (xhigh)", "Sonnet 4.6 (16k)") as the setting; the page's default "best effort" view shows the highest of
// them. Cost and output tokens per task are the run totals divided by the number of trials.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://lisanbench.com/data/core.json';

interface Data {
  models: { id: string; label: string; coverage?: { trials?: number }; output_tokens?: number; estimated_cost_usd?: number }[];
  aggregated: { model: string; sum_chain_avg?: number }[];
}

const board: Leaderboard = {
  benchmark: 'lisanbench',
  url: 'https://lisanbench.com/',
  feed: `${FEED} (aggregated.sum_chain_avg, Path Length)`,
  terms: 'Static JSON on lisanbench.com, which has no robots.txt and publishes no terms of use.',
  aliases: {
    // the board's display names for Meta's models before release
    'Muse Wonder Full': 'muse-wonder-full',
    'Muse Wonder': 'muse-wonder',
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const byId = new Map(data.models.map((m) => [m.id, m]));
    const rows: LeaderboardRow[] = [];
    for (const a of data.aggregated) {
      const m = byId.get(a.model);
      if (!m || typeof a.sum_chain_avg !== 'number') continue;
      const paren = m.label.match(/\s*\(([^)]*)\)$/);
      const trials = m.coverage?.trials;
      rows.push({
        model: paren ? m.label.slice(0, paren.index).trim() : m.label,
        score: a.sum_chain_avg,
        setting: paren?.[1].trim().toLowerCase() || undefined,
        cost: trials && m.estimated_cost_usd ? m.estimated_cost_usd / trials : undefined,
        tokens: trials && m.output_tokens ? m.output_tokens / trials : undefined,
      });
    }
    return rows;
  },
};
export default board;
