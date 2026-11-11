// Moonshot's official release page publishes the Kimi Claw 24/7 whole-benchmark pass rate.
// This is the agentic table, not Kimi Code Bench or other coding benchmarks.
// The linked methodology specifies 17 scenarios, 610 points, OpenClaw, and three runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://www.kimi.ai/resources/kimi-k2-7-code';
const board: Leaderboard = {
  benchmark: 'kimi-claw-24-7-bench', url: FEED, feed: FEED,
  terms: 'Public Moonshot AI release-page results. Benchmark Almanac credits Moonshot AI and links the source.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const scores = t.find(r => r[0]?.text === 'Kimi Claw 24/7 Bench');
      if (!scores) continue;
      for (let i = 1; i < scores.length; i++) {
        const model = t[0]?.[i]?.text, score = num(scores[i].text);
        if (model && score !== undefined) rows.push({model, score, harness: 'OpenClaw', setting: 'average pass rate over 610 evaluation points; mean of 3 runs'});
      }
    }
    if (!rows.length) throw new Error('Kimi Claw 24/7 table missing');
    return rows;
  },
};
export default board;
