// LiveBench: livebench.ai loads data/<release>/table.csv (one column per category) and categories.json
// (category -> columns, plus "_overall_weights") and cost.csv. Costs divide total suite costs by task
// counts. Output tokens use task-count-weighted suite means, matching the page. The chart plots score
// against cost per task. Every scored CSV row is retained, including unlisted model configurations.
// The page's Global Average is the weighted mean of the
// category averages a model has (weight 1 unless listed). The release list and the model metadata
// (which rows the page shows, and each model's reasoning effort) live in the site's main JS bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText, parseCsv } from '../lib/util.ts';

const pause = () => new Promise(resolve => setTimeout(resolve, 1100));
const SITE = 'https://livebench.ai';

interface Bundle {
  release: string;
  shown: Set<string> | null;
  effort: Map<string, string>;
}

async function readBundle(): Promise<Bundle> {
  const html = await fetchText(`${SITE}/`);
  const src = html.match(/src="\.?\/?(static\/js\/main\.[\w]+\.js)"/)?.[1];
  if (!src) throw new Error('main.js not found on livebench.ai');
  await pause();
  const js = await fetchText(`${SITE}/${src}`);
  // the current generation's releases: =["20261014","20261025"]
  const dates = [...js.matchAll(/=\[((?:"20\d{6}",?)+)\]/g)].flatMap((m) => m[1].match(/20\d{6}/g) ?? []);
  if (!dates.length) throw new Error('no release list in main.js');
  const release = dates.sort().at(-1)!;
  // model metadata: gn={"claude-fable-5.1":{displayName:"...",...,effort:"max",...},...}
  const shown = new Set<string>();
  const effort = new Map<string, string>();
  const start = js.indexOf('{"', js.search(/[,;\s]\w{1,3}=\{"[^"]+":\{displayName:/));
  const meta = start > 0 ? js.slice(start, js.indexOf('}},', start) + 2) : '';
  for (const m of meta.matchAll(/[{,]"([^"]+)":\{displayName:([^{}]*)\}/g)) {
    shown.add(m[1]);
    const e = m[2].match(/effort:"([^"]+)"/);
    if (e) effort.set(m[1], e[1]);
  }
  return { release, shown: shown.size ? shown : null, effort };
}

const board: Leaderboard = {
  benchmark: 'livebench',
  url: SITE,
  feed: `${SITE}/data/<newest release>/table.csv, categories.json and cost.csv`,
  terms: "Public data files behind livebench.ai; robots.txt allows everything, and the site states no terms of use.",
  aliases: {
    'muse-wonder-1.0': 'muse-wonder',
  },
  chart: {
    title: 'Score vs. cost per task',
    x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Global Average', unit: '%', better: 'higher' },
    note: 'Global Average against total suite cost divided by the number of tasks in those suites.',
  },
  async fetch() {
    const { release, shown, effort } = await readBundle();
    const base = `${SITE}/data/${release}`;
    await pause();
    const table = parseCsv(await fetchText(`${base}/table.csv`));
    await pause();
    const { _overall_weights: weights = {}, ...cats } = await fetchJson<Record<string, string[]> & { _overall_weights?: Record<string, number> }>(
      `${base}/categories.json`,
    );
    await pause();
    const costs = new Map(parseCsv(await fetchText(`${base}/cost.csv`)).map(r => [r.model, r]));
    const date = `${release.slice(0, 4)}-${release.slice(4, 6)}-${release.slice(6)}`;
    const rows: LeaderboardRow[] = [];
    for (const r of table) {
      if (!r.model) continue;
      let sum = 0;
      let wsum = 0;
      for (const [cat, cols] of Object.entries(cats) as [string, string[]][]) {
        const vals = cols.map((c) => parseFloat(r[c])).filter((v) => !isNaN(v));
        if (!vals.length) continue;
        const w = Number((weights as Record<string, number>)[cat] ?? 1);
        sum += (vals.reduce((a, b) => a + b, 0) / vals.length) * w;
        wsum += w;
      }
      if (!wsum) continue;
      const c = costs.get(r.model);
      let dollars = 0, tasks = 0, output = 0, outputTasks = 0;
      for (const col of (Object.values(cats) as string[][]).flat()) {
        const count = Number(c?.[`nq_${col}`]);
        const cost = Number(c?.[col]);
        const tokens = Number(c?.[`out_${col}`]);
        if (count > 0 && Number.isFinite(cost)) { dollars += cost; tasks += count; }
        if (count > 0 && Number.isFinite(tokens)) { output += tokens * count; outputTasks += count; }
      }
      const cost = tasks ? dollars / tasks : undefined;
      const tokens = outputTasks ? output / outputTasks : undefined;
      rows.push({ model: r.model, score: Math.round((sum / wsum) * 100) / 100, setting: effort.get(r.model), date,
        cost, tokens, metrics: cost !== undefined ? { cost } : undefined });
    }
    return rows;
  },
};
export default board;
