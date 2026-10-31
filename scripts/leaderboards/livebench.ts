// LiveBench: livebench.ai loads data/<release>/table.csv (one column per category) and categories.json
// (category -> columns, plus "_overall_weights"). The page's Global Average is the weighted mean of the
// category averages a model has (weight 1 unless listed). The release list and the model metadata
// (which rows the page shows, and each model's reasoning effort) live in the site's main JS bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText, parseCsv } from '../lib/util.ts';

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
  feed: `${SITE}/data/<newest release>/table.csv and categories.json`,
  terms: "Public data files behind livebench.ai; robots.txt allows everything and the LiveBench code is Apache-2.0.",
  aliases: {},
  async fetch() {
    const { release, shown, effort } = await readBundle();
    const base = `${SITE}/data/${release}`;
    const table = parseCsv(await fetchText(`${base}/table.csv`));
    const { _overall_weights: weights = {}, ...cats } = await fetchJson<Record<string, string[]> & { _overall_weights?: Record<string, number> }>(
      `${base}/categories.json`,
    );
    const date = `${release.slice(0, 4)}-${release.slice(4, 6)}-${release.slice(6)}`;
    const rows: LeaderboardRow[] = [];
    for (const r of table) {
      if (!r.model || (shown && !shown.has(r.model))) continue;
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
      rows.push({ model: r.model, score: Math.round((sum / wsum) * 100) / 100, setting: effort.get(r.model), date });
    }
    return rows;
  },
};
export default board;
