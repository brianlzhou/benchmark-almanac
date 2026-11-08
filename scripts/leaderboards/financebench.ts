// FinanceBench: Table 2 publishes eight configurations on the full 150-question human evaluation sample.
// Correct-answer percentages are the score. Retrieval and context choices apply to the entire evaluation.
// Read the printed percentages, not percentages recomputed from occasionally inconsistent printed counts.
// The paper names Llama2's 70B-chat endpoint in Appendix A. Undated API snapshots remain unlisted.
// These are static paper results and will not refresh with new models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, PAPER_TERMS } from '../lib/boards/arxiv-round3-t.ts';

const FEED = 'https://arxiv.org/html/2311.11944';
const percent = (s: string) => {
  const match = s.match(/^\d+\s*\((\d+(?:\.\d+)?)%\)$/);
  if (!match) throw new Error(`FinanceBench percentage missing: ${s}`);
  return Number(match[1]);
};
const board: Leaderboard = {
  benchmark: 'financebench', url: 'https://github.com/patronus-ai/financebench', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'Llama2 70B Chat': 'llama-2-70b' },
  async fetch() {
    const table = (await paperTables(FEED)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|Configuration|Correct answer|Incorrect answer|Failed to answer|Total');
    if (!table) throw new Error('FinanceBench results table missing');
    const rows: LeaderboardRow[] = [];
    for (const c of table.slice(1)) {
      if (c.length === 1 || c[0].text === 'Total') continue;
      if (c.length !== 6 || c[5].text !== '150') throw new Error('FinanceBench evaluation sample changed');
      rows.push({ model: c[0].text === 'Llama2' ? 'Llama2 70B Chat' : `${c[0].text} (snapshot unspecified)`,
        setting: c[1].text, score: percent(c[2].text), metrics: { incorrect: percent(c[3].text), failed: percent(c[4].text) } });
    }
    if (rows.length !== 8) throw new Error('FinanceBench configurations changed');
    return rows;
  },
};
export default board;
