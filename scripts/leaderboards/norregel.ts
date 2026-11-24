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
  benchmark: 'norregel', url: repo + '/blob/HEAD/docs/RESULTS_V2.md', feed, costPer: 'run',
  terms: 'The results document uses CC BY 4.0. ' + repo + '/blob/HEAD/LICENSE-docs',
  stats: { outdated: { name: 'Outdated answers', unit: '%', better: 'lower' }, error: { name: 'Incorrect answers', unit: '%', better: 'lower' }, uninterpreted: { name: 'Uninterpreted answers', unit: '%', better: 'lower' }, tokensIn: { name: 'Total input tokens', unit: 'tokens' }, tokensOut: { name: 'Total output tokens', unit: 'tokens' } },
  aliases: { 'claude-haiku-4-5-20251001': 'claude-haiku-4-5', 'claude-opus-4-5-20251101': 'claude-opus-4-5',
    'gemma-4-26b-a4b-it': 'gemma-4-26b-a4b' },
  async fetch() {
    const doc = await fetchText(feed);
    const table = doc.split('## T3 Klasseandeler av alle svar')[1]?.split('## T4')[0];
    const tokenTable = doc.split('## T18 Tokens og kostnad')[1]?.split('## T19')[0];
    const usage = new Map<string, {tokensIn: number; tokensOut: number; costUsd: number}>();
    for (const line of tokenTable?.split('\n').filter(l => l.startsWith('| `')) ?? []) {
      const [name, tokensIn, tokensOut, costUsd] = line.split('|').slice(1, -1).map(s => s.trim());
      const parse = (value: string) => Number(value.replaceAll('.', '').replace(',', '.'));
      const parsed = [parse(tokensIn), parse(tokensOut), parse(costUsd)];
      if (parsed.every(Number.isFinite)) {
        const rawName = name.replaceAll('`', '');
        const values = {tokensIn: parsed[0], tokensOut: parsed[1], costUsd: parsed[2]};
        usage.set(rawName, values);
        const alias = board.aliases?.[rawName];
        if (alias) usage.set(alias, values);
      }
    }
    if (!table?.includes('| Modell | n | Serier | korrekt % [95 %] | utdatert % [95 %] | feil % [95 %] | utolket % [95 %] |')) throw Error('Missing v2 all-answer results');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n').filter(l => l.startsWith('| `'))) {
      const [name, n, _series, correct, ...others] = line.split('|').slice(1,-1).map(s => s.trim());
      const [score, low, high, exact] = interval(correct);
      const metrics: Record<string,number> = {};
      if (exact !== undefined) metrics.correctExactUpper = exact;
      if (others.length !== 3) throw Error('Missing error classes');
      for (const [i,key] of ['outdated','error','uninterpreted'].entries()) {
        const [value, lower, upper, exactUpper] = interval(others[i]);
        metrics[key] = value!;
        metrics[key + 'Low'] = lower!;
        metrics[key + 'High'] = upper!;
        if (exactUpper !== undefined) metrics[key + 'ExactUpper'] = exactUpper;
      }
      const model = name.replaceAll('`', '');
      const modelUsage = usage.get(model);
      let cost: number | undefined;
      let tokens: number | undefined;
      if (modelUsage) {
        metrics.tokensIn = modelUsage.tokensIn;
        metrics.tokensOut = modelUsage.tokensOut;
        if (modelUsage.costUsd > 0) cost = modelUsage.costUsd;
        if (modelUsage.tokensOut > 0 && Number(n) > 0) tokens = Math.round(modelUsage.tokensOut / Number(n));
      }
      rows.push({ model, setting: 'v2', score: score!, low, high, cost, tokens, metrics });
    }
    return checked(rows, 8);
  },
};
export default board;
