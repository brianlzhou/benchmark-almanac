// RSI Bench: Scale's own site serves the leaderboard as a static HTML table under the "All" category: model,
// harness, reasoning effort, mean and best run. The score is the mean: mean reward per task, then the average
// across tasks, each task weighted equally. "max (= xhigh) *" marks a model whose max effort equals xhigh.
// The "best run" column is kept as metrics.best.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { scaleHarness } from '../lib/scale.ts';

const PAGE = 'https://rsi-benchmark.com/tasks';

const board: Leaderboard = {
  benchmark: 'rsi-bench-scale',
  url: PAGE,
  feed: `${PAGE} (the leaderboard table in the static HTML)`,
  terms:
    "robots.txt on rsi-benchmark.com allows /tasks; the site links Scale's website terms (August 2021), which limit use to supported browsers for internal purposes. The almanac imports Scale's boards with credit and a link.",
  aliases: {},
  async fetch() {
    const table = tables(await fetchText(PAGE)).find((t) => t[0]?.some((c) => c.text === 'mean'));
    if (!table) throw new Error('no leaderboard table on the page');
    const head = table[0].map((c) => c.text.toLowerCase());
    const col = (name: string) => {
      const i = head.indexOf(name);
      if (i < 0) throw new Error(`no "${name}" column`);
      return i;
    };
    const [model, harness, effort, mean] = ['model', 'harness', 'reasoning effort', 'mean'].map(col);
    const bestCol = head.indexOf('best run');
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(1)) {
      const score = num(r[mean]?.text);
      if (!r[model]?.text || score === undefined) continue;
      const h = r[harness]?.text;
      const best = bestCol >= 0 ? num(r[bestCol]?.text) : undefined;
      rows.push({
        model: r[model].text,
        score,
        setting: r[effort]?.text.match(/^[a-z-]+/i)?.[0].toLowerCase(),
        harness: h ? (scaleHarness(h) ?? h) : undefined,
        ...(best !== undefined ? { metrics: { best } } : {}),
      });
    }
    return rows;
  },
};
export default board;
