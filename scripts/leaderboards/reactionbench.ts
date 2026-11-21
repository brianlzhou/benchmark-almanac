// ReactionBench tests whether a model can relate a viewer's reaction to the video that caused it.
// The leaderboard sorts by stimulus-reaction matching accuracy on a 0 to 1 scale. Its JSON reproduces Table 2.
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const feed = 'https://raw.githubusercontent.com/yibozh/ReactionBench-page/HEAD/src/data/leaderboard.json';
const parts = { ip_joint_rho: 'IP joint: ρ₀', ip_joint_r: 'IP joint: r', ip_indep_rho: 'IP indep.: ρ₀',
  ip_indep_r: 'IP indep.: r', srm_acc: 'SRM: Accuracy', grg_comp: 'GRG: Comp. /5', grg_cue: 'GRG: Cue /2', grg_cons: 'GRG: Cons. /1' };
type Entry = { model: string, access: string } & Record<keyof typeof parts, number>;
const board: Leaderboard = {
  benchmark: 'reactionbench', feed, parts, url: 'https://yibozh.github.io/ReactionBench-page/#leaderboard',
  terms: 'The authors publish this leaderboard on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  headline: 'The board reports no overall score and ranks by stimulus-reaction matching accuracy, measured from 0 to 1.',
  async fetch() {
    const table = await fetchJson<{ columns: { key: string }[], rows: Entry[] }>(feed);
    const keys = Object.keys(parts) as (keyof typeof parts)[];
    if (!keys.every(k => table.columns.some(col => col.key === k))) throw new Error('Missing ReactionBench column');
    return checked(table.rows.map(row => {
      const metrics = Object.fromEntries(keys.map(k => [k, row[k]]));
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete results for ' + row.model);
      return { model: row.model, score: row.srm_acc, metrics, setting: 'Zero-shot', open: row.access === 'open' };
    }), 7);
  },
};
export default board;
