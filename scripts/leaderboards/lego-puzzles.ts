// LEGO-Puzzles: Table 1's Overall accuracy covers all 1,100 questions across the 11 elementary tasks.
// The paper's Lite subset, generation scores and extended planning experiment are not rows on this board.
// These are static paper results and will not refresh except when the paper itself is revised.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-round3-t.ts';

const FEED = 'https://arxiv.org/html/2503.19990';
const KEYS = ['height', 'adjacency', 'rotation', 'multiview', 'nextStep', 'dependency', 'rotationStat', 'position', 'backwards', 'ordering', 'outlier'];
const board: Leaderboard = {
  benchmark: 'lego-puzzles', url: 'https://github.com/Tangkexian/LEGO-Puzzles', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'GPT-o3': 'o3' },
  async fetch() {
    const table = (await paperTables(FEED)).find(t => t[0]?.[0]?.text === 'Models' && t[0]?.at(-1)?.text === 'Overall' && t.some(r => r[0]?.text === 'Proprietary'));
    if (!table) throw new Error('LEGO-Puzzles full elementary table missing');
    const rows: LeaderboardRow[] = [];
    for (const c of table.slice(2)) {
      if (c.length === 1) continue;
      if (/Random/i.test(c[0].text)) continue;
      if (c.length !== 13) throw new Error('LEGO-Puzzles table shape changed');
      let model = c[0].text;
      if (/^(GPT-4o(?:-mini)?|Claude-3\.5-Sonnet|Gemini-(?:1\.5-(?:Flash|Pro)|2\.0-Flash|2\.5-Pro))$/.test(model)) model += ' (snapshot unspecified)';
      rows.push({ model, score: numberCell(c[12].text), metrics: Object.fromEntries(KEYS.map((k, i) => [k, numberCell(c[i + 1].text)])) });
    }
    if (rows.length < 20) throw new Error('LEGO-Puzzles model rows missing');
    return rows;
  },
};
export default board;
