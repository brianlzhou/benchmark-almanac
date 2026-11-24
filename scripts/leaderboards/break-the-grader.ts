// Break the Grader tests whether a model can identify a numerical grader's errors using an exact certificate.
// The author's player comparison gives mean reward, with separate solve rates for four difficulty bands.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://carlostoledo.co/reports/gym.html';
const bands = ['impossible', 'razor', 'narrow', 'wide'];
const board: Leaderboard = {
  benchmark: 'break-the-grader', url, feed: url,
  terms: 'The author releases Break the Grader under MIT. https://app.primeintellect.ai/dashboard/environments/carlos-toledo/break-the-grader',
  parts: Object.fromEntries(bands.map(name => [name, { name, unit: '%', note: 'Percentage solved in this difficulty band.' }])),
  stats: {
    solved: { name: 'Solved', unit: '%', better: 'higher' }, falseClaims: { name: 'False claims', unit: 'count', better: 'lower' },
    cases: { name: 'Scored cases', unit: 'count' },
  },
  async fetch() {
    const table = tables(await fetchText(url)).find(t => t[0]?.map(c => c.text).join('|') ===
      'player|kind|n|mean reward|solved|false claims|impossible|razor|narrow|wide');
    if (!table) throw new Error('Missing player comparison');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const [model, kind, n, reward, solved, claims, ...parts] = row.map(c => c.text);
      if (kind === 'policy') continue;
      if (!kind.startsWith('model') || !/^\d+$/.test(n) || !/^\d+$/.test(claims) ||
          !/^\d+(?:\.\d+)?%$/.test(solved) || parts.length !== bands.length) throw new Error('Invalid model row');
      const metrics: Record<string, number> = { cases: Number(n), solved: parseFloat(solved), falseClaims: Number(claims) };
      for (const [i, cell] of parts.entries()) {
        const fraction = cell.match(/^(\d+)\/(\d+)$/);
        if (!fraction || Number(fraction[2]) === 0) throw new Error('Invalid difficulty band fraction');
        metrics[bands[i]] = Number(fraction[1]) / Number(fraction[2]) * 100;
      }
      rows.push({ model, score: Number(reward.replace('−', '-')), setting: kind.replace(/^model\s*·\s*/, ''), metrics });
    }
    return checked(rows, 3);
  },
};
export default board;
