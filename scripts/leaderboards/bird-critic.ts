// BIRD-CRITIC (BIRD team, HKU). bird-critic.github.io is a static page whose first table is the leaderboard:
// Rank | Model | SR (%) | Institute | Link | Date | Tier. Success rate (0 to 100) is the score and the
// date the row date. The second table holds the human baseline and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://bird-critic.github.io/';

const board: Leaderboard = {
  benchmark: 'bird-critic',
  url: URL,
  feed: `${URL} (static HTML table, SR)`,
  terms: 'Static GitHub Pages site; the BIRD-CRITIC data is CC BY-SA 4.0 and the page states no other terms.',
  aliases: {
    // DeepSeek's deepseek-reasoner endpoint in April 2025 served R1 (January release)
    'deepseek-reasoner (r1)': 'deepseek-r1',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'SR (%)'));
    if (!t) throw new Error('BIRD-CRITIC table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore, iDate] = [head.indexOf('Model'), head.indexOf('SR (%)'), head.indexOf('Date')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const date = r[iDate]?.text;
      // "o1-preview-2025-04-20": the run date, appended to the name on this board, is not part of it
      const model = (r[iModel]?.text ?? '').replace(/-\d{4}-\d\d-\d\d$/, '');
      const score = num(r[iScore]?.text);
      if (!model || score === undefined || /human/i.test(model)) continue;
      rows.push({ model, score, date: /^\d{4}-\d\d-\d\d$/.test(date ?? '') ? date : undefined });
    }
    return rows;
  },
};
export default board;
