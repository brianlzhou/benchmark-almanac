// CC-Bench-V2: Backend Pass@1, in percent. Other suite components are excluded.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2602.15763";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "cc-bench-v2-backend-zai",
  url: "https://raw.githubusercontent.com/zai-org/GLM-5/main/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[16];
    const r = t?.find(r => r.some(c => c.text === 'Backend'));
    if (!r || !r.some(c => c.text === 'Pass@1')) throw new Error('CC-Bench-V2 row changed');
    const models = t[0].slice(-3).map(c => c.text);
    return models.map((model,i) => ({model:paperModel(model), score:num(r[r.length-3+i].text)!}));
  },
};
export default board;
