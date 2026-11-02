// SlopCodeBench. www.scbench.ai/leaderboard is a Next.js page whose server HTML carries the full results
// table: Model (effort) | Harness | Version | Strict Solve | Iso Solve | $/CKPT | Erosion | Verbosity. The
// table is sorted by Iso Solve, the "isolated solve" rate the home page leads with, so that is the score
// (0 to 100). The harness column is the agent; $/CKPT, the cost of one checkpoint (the unit the agent
// solves), is the cost.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://www.scbench.ai/leaderboard';

const board: Leaderboard = {
  benchmark: 'slopcodebench',
  url: URL,
  feed: `${URL} (server-rendered table, Iso Solve)`,
  terms: 'Server-rendered public page; scbench.ai serves no robots.txt (the path returns a 404 page) and publishes no terms.',
  aliases: {
    'Opus 4.5': 'claude-opus-4-5',
    'Opus 4.6': 'claude-opus-4-6',
    'Opus 4.7': 'claude-opus-4-7',
    'Sonnet 4.6': 'claude-sonnet-4-6',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Iso Solve/.test(c.text)));
    if (!t) throw new Error('SlopCodeBench table not found');
    const head = t[0].map((c) => c.text.replace(/\s*[▲▼]$/, ''));
    const col = (name: string) => head.indexOf(name);
    const [iModel, iHarness, iScore, iCost] = [col('Model'), col('Harness'), col('Iso Solve'), col('$/CKPT')];
    if ([iModel, iHarness, iScore].some((i) => i < 0)) throw new Error(`unexpected columns: ${head.join(', ')}`);
    return t.slice(1).map((r) => {
      const name = r[iModel]?.text ?? '';
      const effort = /\(([^)]+)\)$/.exec(name)?.[1]?.toLowerCase();
      return {
        model: name.replace(/\s*\([^)]*\)$/, ''),
        score: num(r[iScore]?.text) ?? NaN,
        setting: effort,
        harness: r[iHarness]?.text || undefined,
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
      };
    });
  },
};
export default board;
