// CLUE's paper Table 2 reports Avg across all nine tasks: "Avg is the average of all tasks."
// Read the published Avg directly. These are static paper baselines, not a refreshing submission board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2004.05986';
const board: Leaderboard = {
  benchmark: 'clue', url: FEED, feed: FEED,
  terms: 'The authors publish this paper on arXiv. Credit the CLUE authors for the reported baseline results.',
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t.some(r => r[0]?.text === 'Model' && r[1]?.text === 'Avg'));
    if (!table) throw new Error('CLUE overall table missing');
    const headerAt = table.findIndex(r => r[0]?.text === 'Model' && r[1]?.text === 'Avg');
    const head = table[headerAt].map(c => c.text);
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(headerAt + 1)) {
      const score = num(row[1]?.text);
      if (score === undefined || !row[0]?.text) continue;
      const metrics: Record<string, number> = {};
      for (let i=2; i<head.length; i++) { const n=num(row[i]?.text); if(n!==undefined) metrics[head[i]]=n; }
      rows.push({model: /human/i.test(row[0].text) ? row[0].text : row[0].text + ' (CLUE checkpoint)', score, metrics});
    }
    if (!rows.length) throw new Error('No CLUE baseline scores');
    return rows;
  },
};
export default board;
