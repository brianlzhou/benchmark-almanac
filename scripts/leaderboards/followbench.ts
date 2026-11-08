// FollowBench: the original benchmark's main Table 2 reports HSR Avg. over all constraints and five levels.
// This is the paper's default English FollowBench evaluation. FollowBench-zh is a separately named extension
// in Appendix D; its HSR average is a supplementary metric, not a competing row or an invented aggregate.
// These are static paper results and will not refresh with new models.
import type { Leaderboard } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-round3-t.ts';

const FEED = 'https://arxiv.org/html/2310.20410';
const board: Leaderboard = {
  benchmark: 'followbench', url: 'https://github.com/yjiangcm/FollowBench', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'GPT-4-Preview-1106': 'gpt-4-turbo-nov-2023', 'GPT-3.5-Turbo-1106': 'gpt-3-5-turbo-nov-2023' },
  async fetch() {
    const all = await paperTables(FEED);
    const candidates = all.filter(t => t[0]?.[1]?.text === 'HSR (%)' && t[1]?.[6]?.text === 'Avg.');
    const table = candidates[0];
    if (!table || table.length < 15) throw new Error('FollowBench main HSR table missing');
    // FollowBench-zh is the last such table, following all per-category English tables.
    const zh = candidates.at(-1)!;
    const zhScores = new Map(zh.slice(2).map(c => [c[0].text, numberCell(c[6].text)]));
    return table.slice(2).map(c => {
      if (c.length !== 14) throw new Error('FollowBench table shape changed');
      const metrics: Record<string, number> = { ssr: numberCell(c[12].text), constraintLevel: numberCell(c[13].text) };
      for (let i = 1; i <= 5; i++) metrics[`level${i}`] = numberCell(c[i].text);
      if (zhScores.has(c[0].text)) metrics.zhHSR = zhScores.get(c[0].text)!;
      return { model: c[0].text, score: numberCell(c[6].text), metrics };
    });
  },
};
export default board;
