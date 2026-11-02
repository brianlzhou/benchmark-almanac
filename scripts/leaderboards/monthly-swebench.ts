// Monthly-SWEBench (UniPat AI with xbench). unipat.ai/benchmarks/MonthlySWEBench is server-rendered and
// carries its data inline as `var SWE_DATA = {...}`: per category (Overall, Bug Fix, Non-Bug Fix) and
// monthly snapshot ("2026-06"), per model the pass@1 over that month's ~100 tasks, the agent and turn counts.
// Each month is a new task set, so months do not compare: only the newest snapshot of the Overall category,
// the page's default view, is read. pass@1 (0 to 100) is the score and the agent (OpenHands, Terminus-2) the
// harness. Unranked rows without a pass@1 are skipped. Names carry the effort ("GPT-5.5-High"), which the
// resolver splits off.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const URL = 'https://unipat.ai/benchmarks/MonthlySWEBench';

interface Data {
  data: { Overall: { snapshots: Record<string, { modelName: string; passAt1?: number; agent?: string }[]> } };
}

const board: Leaderboard = {
  benchmark: 'monthly-swebench',
  url: URL,
  feed: `${URL} (inline SWE_DATA, newest Overall snapshot)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Hunyuan-HY3-Preview': 'tencent-hy3-preview',
    'Doubao-Seed-2.1-Pro': 'seed-2-1-pro',
    'Doubao-Seed-2.0-Pro': 'seed-2-0-pro',
  },
  async fetch() {
    const html = await fetchText(URL);
    const at = html.indexOf('var SWE_DATA = ');
    if (at < 0) throw new Error('SWE_DATA not found on the Monthly-SWEBench page');
    const data = jsLiteral<Data>(html, at + 'var SWE_DATA = '.length);
    const snaps = data.data.Overall.snapshots;
    const month = Object.keys(snaps).filter((k) => /^\d{4}-\d\d$/.test(k)).sort().at(-1);
    if (!month) throw new Error('no monthly snapshot in SWE_DATA');
    const rows: LeaderboardRow[] = [];
    for (const r of snaps[month]) {
      if (typeof r.passAt1 !== 'number') continue;
      rows.push({ model: r.modelName, score: r.passAt1, harness: r.agent });
    }
    return rows;
  },
};
export default board;
