// BaxBench (ETH Zurich SRI Lab, LogicStar.ai and others). baxbench.com loads one JSON per prompt type from
// /static/data/: leaderboard_data_none.json (no security reminder, the page's default), _generic.json and
// _specific.json (the oracle reminder naming the relevant weaknesses). Each row has pass_1 (functionally
// correct) and sec_pass_1 (correct and secure, 0 to 1), the default sort and the score here (0 to 100). The
// default prompt has no setting; the two reminder prompts keep theirs. The abb_* files belong to a separate
// benchmark and are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATA = (kind: string) => `https://baxbench.com/static/data/leaderboard_data_${kind}.json`;
const PROMPTS: [string, string | undefined][] = [
  ['none', undefined],
  ['generic', 'generic security reminder'],
  ['specific', 'oracle security reminder'],
];

const board: Leaderboard = {
  benchmark: 'baxbench',
  url: 'https://baxbench.com/',
  feed: `${DATA('{none,generic,specific}')} (sec_pass_1)`,
  terms: 'Static JSON on the BaxBench GitHub Pages site, which states no terms; the BaxBench repository and dataset are MIT.',
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [kind, setting] of PROMPTS) {
      const data = await fetchJson<{ model: string; sec_pass_1?: number }[]>(DATA(kind));
      for (const r of data) if (r.model && typeof r.sec_pass_1 === 'number') rows.push({ model: r.model, score: r.sec_pass_1 * 100, setting });
    }
    return rows;
  },
};
export default board;
