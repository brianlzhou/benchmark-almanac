// Holdings-IndividualTaxBench on evals.thriveholdings.com. The home page renders this benchmark by default,
// with a full results table: Model | Effort | Accuracy | Recall | Precision | Minutes per package | Cost per
// return (USD) | Tokens per return. Accuracy (0 to 100) is the score, the effort the setting and the cost
// per return the cost of one task. The Helpdesk ticket benchmark on the same site renders only in the
// browser and is not read here. The reader lives in visulogic.ts.
// Minutes per package is kept as metrics.latency in seconds: the page's "Performance, cost & time" chart
// plots accuracy against it. Tokens per return count input too (millions per return), so they are not kept.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { readTable } from './visulogic.ts';

const URL = 'https://evals.thriveholdings.com/';

const board: Leaderboard = {
  benchmark: 'holdings-individualtaxbench',
  url: `${URL}?benchmark=individual-tax#individual-tax`,
  feed: `${URL} (results table, Accuracy)`,
  terms: 'Server-rendered public page; robots.txt allows all paths and the site publishes no terms.',
  aliases: {},
  chart: {
    title: 'Performance, cost & time',
    note: 'Each point is one model at one reasoning effort: accuracy against the minutes it takes to prepare one return.',
    x: { key: 'latency', label: 'Time per return', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const rows = readTable(html, { model: /^Model$/i, score: /^Accuracy$/i, setting: /^Effort$/i, cost: /^Cost per return/i });
    // the same table's Minutes per package, by model and effort
    const t = tables(html).find((r) => r[0]?.some((c) => /^Minutes per package/i.test(c.text)));
    const head = t?.[0].map((c) => c.text) ?? [];
    const [iModel, iEffort, iMin] = [/^Model$/i, /^Effort$/i, /^Minutes per package/i].map((re) => head.findIndex((h) => re.test(h)));
    const minutes = new Map((t ?? []).slice(1).map((r) => [`${r[iModel]?.text}|${r[iEffort]?.text}`, num(r[iMin]?.text)]));
    for (const r of rows) {
      const m = minutes.get(`${r.model}|${r.setting ?? ''}`);
      if (m !== undefined) r.metrics = { latency: Math.round(m * 60) };
    }
    return rows;
  },
};
export default board;
