// ERQA on Embodied Arena (embodied-arena.com, Tianjin University). The site is a Quasar app whose whole
// dataset ships in one Vite chunk, /assets/data-<hash>.js, as JSON.parse(...) literals: `benchmark` (each
// benchmark's properties, with the column index of its default "Total" score) and `model` (per model,
// score.benchmark[<benchmark id>].legacy, one array per benchmark in property-index order). The ERQA
// column of the Embodied Question Answering board in the Benchmark View is legacy[index of Total], so that
// is the score (0 to 100). The chunk name changes with each deploy, so the reader finds it from the page's
// entry script. Embodied Arena runs every model itself, so its numbers differ from lab-reported ERQA.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://www.embodied-arena.com';

interface Bench {
  $data: { code: string; default?: { property?: string }; properties: Record<string, { index: number }> };
}
interface Model {
  $data: { name: string; score?: { benchmark?: Record<string, { legacy?: (number | null)[] }> } };
}

/** The `name=JSON.parse(...)` literal in the data chunk, read as data (single quotes or backticks). */
function literal<T>(js: string, name: string): T {
  const m = js.match(new RegExp(`[,;\\s]${name}=JSON\\.parse\\((['\`])`));
  if (!m || m.index === undefined) throw new Error(`no ${name}=JSON.parse in the data chunk`);
  const quote = m[1];
  const start = m.index + m[0].length;
  let i = start;
  while (i < js.length && js[i] !== quote) i += js[i] === '\\' ? 2 : 1;
  const body = js.slice(start, i);
  // undo the JS string escaping of the literal, then read it as JSON
  const raw = quote === '`' ? body.replace(/\\([`$\\])/g, '$1') : body.replace(/\\(['\\])/g, '$1');
  return JSON.parse(raw) as T;
}

/** Rows for one Embodied Arena benchmark (by its code, for example "erqa"), at its default property. */
export async function embodiedArenaRows(code: string): Promise<LeaderboardRow[]> {
  const page = await fetchText(`${SITE}/`);
  const entry = page.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  if (!entry) throw new Error('entry script not found');
  const chunk = (await fetchText(SITE + entry)).match(/\.\/(data-[\w-]+\.js)/)?.[1];
  if (!chunk) throw new Error('data chunk not found in the entry script');
  const js = await fetchText(`${SITE}/assets/${chunk}`);
  const benches = literal<Record<string, Bench>>(js, 'l');
  const models = literal<Record<string, Model>>(js, 'b');
  const found = Object.entries(benches).find(([, b]) => b.$data.code === code);
  if (!found) throw new Error(`benchmark ${code} not found`);
  const [id, bench] = found;
  const prop = bench.$data.default?.property ?? 'Total';
  const col = bench.$data.properties[prop]?.index;
  if (col === undefined) throw new Error(`no ${prop} column for ${code}`);
  const rows: LeaderboardRow[] = [];
  for (const { $data: m } of Object.values(models)) {
    const v = m.score?.benchmark?.[id]?.legacy?.[col];
    if (typeof v === 'number') rows.push({ model: m.name, score: v });
  }
  if (!rows.length) throw new Error(`no ${code} scores`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'erqa',
  url: `${SITE}/#/leaderboard/09b4a56a-2e41-4103-a330-129381c24450`,
  feed: `${SITE}/assets/data-<hash>.js (model score.benchmark legacy arrays, ERQA Total column)`,
  terms: 'The site ships its data in its own public JS bundle; it publishes no robots.txt (the path serves the app) and no terms of use.',
  fetch: () => embodiedArenaRows('erqa'),
};
export default board;
