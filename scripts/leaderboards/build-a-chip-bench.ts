// Build-A-Chip-Bench. ChipAgents publishes its results as Table 1 on the benchmark's research page, a static
// HTML table: Functional pass, GDS pass, PPA vs. constraint and Score. The headline is Score, the mean over
// all 20 tasks with a design that fails either gate scored as zero. Every run uses OpenCode as the agent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://chipagents.ai/research/build-a-chip-bench';

const board: Leaderboard = {
  benchmark: 'build-a-chip-bench',
  url: URL,
  feed: `${URL} (Table 1)`,
  terms: 'Public research page. robots.txt allows /research/ and the site publishes no terms for it.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const t = tables(html).find((rows) => rows[0]?.some((c) => /^score$/i.test(c.text)) && rows[0]?.some((c) => /functional/i.test(c.text)));
    if (!t) throw new Error('results table not found');
    const head = t[0].map((c) => c.text.toLowerCase());
    const iModel = head.findIndex((h) => h === 'model');
    const iScore = head.findIndex((h) => h === 'score');
    if (iModel < 0 || iScore < 0) throw new Error(`unexpected columns: ${head.join(', ')}`);
    return t
      .slice(1)
      .map((r) => ({ model: r[iModel]?.text ?? '', score: num(r[iScore]?.text) ?? NaN, harness: 'OpenCode' }))
      .filter((r) => r.model && Number.isFinite(r.score));
  },
};
export default board;
