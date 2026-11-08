// FinanceReasoning: the paper's Avg. on its own benchmark, across all three difficulty levels.
// CoT and PoT are whole-benchmark prompting configurations. Other financial datasets are excluded.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2506.05828";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "financereasoning",
  url: "https://bupt-reasoning-lab.github.io/FinanceReasoning",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[3];
    if (!t?.[0]?.some(c => c.text === 'Avg.')) throw new Error('FinanceReasoning table changed');
    const rows: LeaderboardRow[] = [];
    for (const r of t) {
      if (r.length !== 14) continue;
      const raw = r[0].text + (/^Llama /.test(r[0].text) ? ' ' + r[1].text : '');
      for (const [setting,offset] of [['CoT',0],['PoT',1]] as const) {
        const score = num(r[12+offset].text); if (score === undefined) continue;
        rows.push({model:paperModel(raw), score, setting, metrics:{hard:num(r[3+offset].text)!, medium:num(r[6+offset].text)!, easy:num(r[9+offset].text)!}});
      }
    }
    if (rows.length !== 25) throw new Error('FinanceReasoning expected 25 rows');
    return rows;
  },
};
export default board;
