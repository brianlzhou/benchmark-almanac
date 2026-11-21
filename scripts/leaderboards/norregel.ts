// norregel asks for dated numeric values from Norwegian law. Table T3 of the v2 results reports
// the percentage of all answers that were correct, including uninterpreted answers in the denominator.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const repo = 'https://github.com/avalyset/norregel';
const feed = 'https://raw.githubusercontent.com/avalyset/norregel/HEAD/docs/RESULTS_V2.md';
function interval(cell: string) {
  const match = cell.match(/^(\d+,\d+) \[(\d+,\d+); (\d+,\d+)\](?: \(eksakt øvre (\d+,\d+)\))?$/);
  if (!match) throw Error('Invalid v2 class interval: ' + cell);
  return match.slice(1).map(v => v === undefined ? undefined : Number(v.replace(',', '.')));
}
const board: Leaderboard = {
  benchmark: 'norregel', url: repo + '/blob/HEAD/docs/RESULTS_V2.md', feed,
  terms: 'The results document uses CC BY 4.0. ' + repo + '/blob/HEAD/LICENSE-docs',
  stats: { answers: { name: 'Answers', unit: 'count' }, series: { name: 'Series', unit: 'count' }, outdated: { name: 'Outdated answers', unit: '%', better: 'lower' }, error: { name: 'Incorrect answers', unit: '%', better: 'lower' }, uninterpreted: { name: 'Uninterpreted answers', unit: '%', better: 'lower' } },
  aliases: { 'claude-haiku-4-5-20251001': 'claude-haiku-4-5', 'claude-opus-4-5-20251101': 'claude-opus-4-5',
    'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b' },
  async fetch() {
    const doc = await fetchText(feed);
    const table = doc.split('## T3 Klasseandeler av alle svar')[1]?.split('## T4')[0];
    if (!table?.includes('| Modell | n | Serier | korrekt % [95 %] | utdatert % [95 %] | feil % [95 %] | utolket % [95 %] |')) throw Error('Missing v2 all-answer results');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n').filter(l => l.startsWith('| `'))) {
      const [name, n, series, correct, ...others] = line.split('|').slice(1,-1).map(s => s.trim());
      const [score, low, high, exact] = interval(correct);
      const metrics: Record<string,number> = { answers: Number(n), series: Number(series) };
      if (exact !== undefined) metrics.correctExactUpper = exact;
      if (others.length !== 3) throw Error('Missing error classes');
      for (const [i,key] of ['outdated','error','uninterpreted'].entries()) {
        const [value, lower, upper, exactUpper] = interval(others[i]);
        metrics[key] = value!;
        metrics[key + 'Low'] = lower!;
        metrics[key + 'High'] = upper!;
        if (exactUpper !== undefined) metrics[key + 'ExactUpper'] = exactUpper;
      }
      rows.push({ model: name.replaceAll('`', ''), setting: 'v2', score: score!, low, high, metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
