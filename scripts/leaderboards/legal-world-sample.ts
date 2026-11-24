// Agents act as a law firm's assistant. The Harbor README reports runs passed across four tasks.
// Each model has three attempts per task. Grok also ran with the terminus-2 harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://hub.harborframework.com/datasets/doe/legal-world-sample';
const parts = { production: 'supplemental-production', hearing: 'tell-client-hearing-stands',
  intake: 'intake-conflict-opposing-party', settlement: 'settlement-counteroffer' };
const board: Leaderboard = {
  benchmark: 'legal-world-sample', url, feed: url,
  terms: 'The publisher marks the dataset private for licensed use only. These results appear publicly at ' + url,
  parts, stats: {
    pass3: { name: 'Tasks passed in every run', unit: '%', better: 'higher' },
    calls: { name: 'Median tool calls per run', unit: 'count' },
    minutes: { name: 'Median minutes per run', unit: 'minutes' },
    medianCost: { name: 'Median model cost per run', unit: 'usd' },
    opened: { name: 'Runs that opened the deciding record', unit: '%' },
  },
  async fetch() {
    const grids = tables(await fetchText(url)).map(t => t.map(row => row.map(c => c.text)));
    function table(header: string[]) {
      const t = grids.find(t => JSON.stringify(t[0]) === JSON.stringify(header));
      if (!t) throw new Error('Missing table: ' + header.join(', '));
      return t;
    }
    function cell(t: string[][], label: string, i: number) {
      const value = t.find(row => row[0] === label)?.[i];
      if (!value) throw new Error('Missing value for ' + label);
      return value;
    }
    function rate(s: string) {
      const m = s.match(/^(\d+) of (\d+)$/);
      if (!m || +m[2] === 0) throw new Error('Invalid pass count: ' + s);
      return 100 * +m[1] / +m[2];
    }
    const models = ['Opus 5.5', 'GPT 6.1 Sol', 'Grok 4.7'];
    const main = table(['Task', ...models]);
    const medians = table(['Per run (median)', ...models]);
    const grok = table(['Grok 4.7', 'Grok Build', 'terminus-2']);
    function result(t: string[][], i: number, model: string, harness: string): LeaderboardRow {
      const metrics = Object.fromEntries(Object.entries(parts).map(([key, task]) => [key, rate(cell(t, task, i))]));
      return { model, harness, score: rate(cell(t, 'Runs passed', i)), trials: 3, metrics };
    }
    const rows = models.map((model, idx) => {
      const i = idx + 1;
      const row = result(main, i, model, ['claude-code', 'codex', 'Grok Build'][idx]);
      row.setting = 'Highest reasoning setting';
      row.metrics!.pass3 = rate(cell(main, 'Tasks passed in every run', i));
      row.metrics!.calls = Number(cell(medians, 'Tool calls', i));
      row.metrics!.minutes = Number(cell(medians, 'Minutes', i));
      const cost = cell(medians, 'Model cost', i);
      if (cost !== 'not metered') row.metrics!.medianCost = Number(cost.replace('$',''));
      return row;
    });
    rows[2].metrics!.opened = rate(cell(grok, 'Runs that opened the deciding record', 1));
    const alt = result(grok, 2, 'Grok 4.7', 'terminus-2');
    alt.metrics!.opened = rate(cell(grok, 'Runs that opened the deciding record', 2));
    alt.metrics!.calls = Number(cell(grok, 'Median tool calls per run', 2));
    alt.metrics!.minutes = Number(cell(grok, 'Median minutes per run', 2));
    if (!rows.concat(alt).every(row => Object.values(row.metrics!).every(Number.isFinite))) throw new Error('Invalid run metric');
    return checked([...rows, alt], 4);
  },
};
export default board;
