// Vending-Bench 2 (Andon Labs). andonlabs.com is a prerendered SvelteKit site. The page's "Current
// leaderboard" table is built from a JS data module (runs.vb2: one entry per model with final_value, the
// mean money balance in USD after the simulated year, plus SEM, geomean and the daily time series). The
// module's file name is a build hash, so the importer reads the page, follows the page's own node chunks to
// the modules they import, and takes the one that holds `vb2:{`. The headline is the mean final balance,
// the table's default metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://andonlabs.com/evals/vending-bench-2';
const BASE = 'https://andonlabs.com/_app/immutable/';

/** The object literal that starts at `i` (the first "{" at or after it), skipping quoted strings. */
function objectAt(js: string, i: number): string {
  const start = js.indexOf('{', i);
  let depth = 0;
  for (let k = start; k < js.length; k++) {
    const c = js[k];
    if (c === '"' || c === "'" || c === '`') k = js.indexOf(c, k + 1);
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return js.slice(start, k + 1);
  }
  throw new Error('unterminated object');
}

/** Minified JS literal (bare keys, ".5", !0) to JSON. The data holds only numbers, arrays and quoted names. */
function toJson(literal: string): string {
  return literal
    .replace(/([{,])([A-Za-z_$][\w$]*):/g, '$1"$2":')
    .replace(/([:[,])(-?)\.(\d)/g, '$1$20.$3')
    .replace(/!0\b/g, 'true')
    .replace(/!1\b/g, 'false');
}

async function findDataModule(): Promise<{ url: string; js: string }> {
  const html = await fetchText(PAGE);
  const nodes = [...new Set([...html.matchAll(/_app\/immutable\/(nodes\/[\w.-]+\.js)/g)].map((m) => m[1]))];
  const imported = new Set<string>();
  for (const node of await Promise.all(nodes.map((n) => fetchText(BASE + n)))) {
    for (const m of node.matchAll(/from"\.\.\/chunks\/([\w.-]+\.js)"/g)) imported.add(`chunks/${m[1]}`);
  }
  const candidates = await Promise.all([...imported].map(async (c) => ({ url: BASE + c, js: await fetchText(BASE + c) })));
  const hit = candidates.find((c) => c.js.includes('vb2:{"'));
  if (!hit) throw new Error('no module with runs.vb2 found');
  return hit;
}

const board: Leaderboard = {
  benchmark: 'vending-bench-2',
  url: PAGE,
  feed: `${BASE}chunks/<hash>.js (the runs.vb2 data module the page imports)`,
  terms: 'Public static asset of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    // the registry names the hosted Qwen 3.5 Plus by its weights
    'Qwen 3.5 Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  },
  async fetch() {
    const { js } = await findDataModule();
    const runs = JSON.parse(toJson(objectAt(js, js.indexOf('vb2:{"')))) as Record<string, { final_value?: number }>;
    const rows: LeaderboardRow[] = [];
    for (const [name, r] of Object.entries(runs)) {
      if (typeof r.final_value !== 'number') continue;
      let model = name;
      let setting: string | undefined;
      let harness: string | undefined;
      // "Claude Fable 5 - High": the effort follows " - "
      const effort = model.match(/^(.*) - (\w+)$/);
      if (effort) [model, setting] = [effort[1], effort[2].toLowerCase()];
      // "Kimi K3 (Fireworks)": the API provider the run went through
      const via = model.match(/^(.*) \((Fireworks|Moonshot|OpenRouter|Together)\)$/);
      if (via) [model, setting] = [via[1], `via ${via[2]}`];
      // "Gemini 3.1 Pro Custom Tools": the same model with Andon's custom tool set
      if (/ Custom Tools$/.test(model)) [model, harness] = [model.replace(/ Custom Tools$/, ''), 'custom tools'];
      rows.push({ model, score: r.final_value, setting, harness });
    }
    return rows;
  },
};
export default board;
