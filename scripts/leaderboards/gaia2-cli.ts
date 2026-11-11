// Gaia2-CLI is the CLI task set, separate from legacy Gaia2. The official Space publishes its live data
// as a literal in app.py. Read the literal as JSON data, never execute the downloaded Python.
// pass1 is the full-set percentage. Search, execution, adaptability, ambiguity, and time are capability scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = 'https://huggingface.co/spaces/meta-agents-research-environments/leaderboard/resolve/main/app.py';
const board: Leaderboard = {
  benchmark: 'gaia2-cli',
  url: 'https://huggingface.co/spaces/meta-agents-research-environments/leaderboard',
  feed: `${FEED} (_GAIA2_CLI_DATA)`,
  terms: 'The official Meta Space is public; the almanac credits and links the authors, and the underlying ARE repository is MIT licensed.',
  async fetch() {
    const source = await fetchText(FEED);
    const marker = source.indexOf('_GAIA2_CLI_DATA =');
    if (marker < 0) throw new Error('Gaia2-CLI data marker missing');
    const data = jsLiteral<Record<string, string | number>[]>(source, source.indexOf('[', marker));
    const harness = source.match(/r\.get\("harness",\s*"([^"]+)"\)/)?.[1];
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (typeof r.model !== 'string' || typeof r.pass1 !== 'number') continue;
      const effort = r.model.match(/\s*\((high|xhigh|enabled)\)$/);
      const metrics = Object.fromEntries(['search', 'execution', 'adaptability', 'ambiguity', 'time'].flatMap(key =>
        typeof r[key] === 'number' ? [[key, r[key]]] : []));
      rows.push({model: effort ? r.model.slice(0, effort.index) : r.model, score: r.pass1,
        setting: effort?.[1], harness, date: typeof r.date === 'string' ? r.date : undefined, metrics});
    }
    if (!rows.length) throw new Error('Gaia2-CLI has no scores');
    return rows;
  },
};
export default board;
