// Vending-Bench Arena (Andon Labs). andonlabs.com is a prerendered SvelteKit site. The arena page shows one
// section per round (three to five models running vending machines at the same location), each with a chart
// drawn from the shared runs data module, c.runs["arena-..."]: per model, final_value, the mean money balance
// in USD at the end of the simulated year across that round's runs. This file follows the page's node chunk
// that names the arena runs to the data module it imports, and reads every run the page shows (a 2v2 test run
// in the module that the page does not show is skipped). Newer builds hold the runs as runs:JSON.parse(`...`),
// read as JSON text; older ones as a minified object literal. A balance depends on the round's opponents, so each
// row carries them as its setting ("vs GPT-6 Astra, Gemini 4 Argon"), and a model gets one row per round.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://andonlabs.com/evals/vending-bench-arena';
const BASE = 'https://andonlabs.com/_app/immutable/';

/** The object literal that starts at the first "{" at or after `i`, skipping quoted strings. */
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
const toJson = (literal: string) =>
  literal
    .replace(/([{,])([A-Za-z_$][\w$]*):/g, '$1"$2":')
    .replace(/([:[,])(-?)\.(\d)/g, '$1$20.$3')
    .replace(/!0\b/g, 'true')
    .replace(/!1\b/g, 'false');

const board: Leaderboard = {
  benchmark: 'vending-bench-arena',
  url: PAGE,
  feed: `${BASE}chunks/<hash>.js (runs["arena-..."] in the data module the page imports)`,
  terms: 'Public static asset of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  async fetch() {
    const html = await fetchText(PAGE);
    const nodes = [...new Set([...html.matchAll(/_app\/immutable\/(nodes\/[\w.-]+\.js)/g)].map((m) => m[1]))];
    let keys: string[] = [];
    let module = '';
    for (const n of nodes) {
      const js = await fetchText(BASE + n);
      // keys are quoted with " or with backticks, depending on the build
      const found = [...js.matchAll(/\.runs\[["`](arena-[^"`]+)["`]\]/g)].map((m) => m[1]);
      if (!found.length) continue;
      keys = [...new Set(found)];
      // the runs object comes from `import{m as c}from"../chunks/<hash>.js"` (or `t as l`)
      const alias = js.match(/(\w+)\.runs\[["`]arena-/)?.[1];
      module = js.match(new RegExp(`import\\{[^}]*\\b\\w+ as ${alias}\\b[^}]*\\}from"\\.\\./(chunks/[\\w.-]+\\.js)"`))?.[1] ?? '';
      break;
    }
    if (!keys.length || !module) throw new Error('arena runs or data module not found');
    const data = await fetchText(BASE + module);
    type Runs = Record<string, Record<string, { final_value?: number }>>;
    let runs: Runs;
    // newer builds: runs:JSON.parse(`{"vb2":{...}}`), JSON in a template literal (undo its escapes, never run it)
    const marker = 'runs:JSON.parse(`';
    const jp = data.indexOf(marker);
    if (jp >= 0) {
      const body = data.slice(jp + marker.length, data.indexOf('`)', jp));
      runs = JSON.parse(body.replace(/\\([\\`$])/g, '$1')) as Runs;
    } else {
      // older builds: a minified object literal, x={vb2:{...}}
      const at = data.search(/\w=\{vb2:\{/);
      if (at < 0) throw new Error('runs object not found');
      runs = JSON.parse(toJson(objectAt(data, at))) as Runs;
    }
    const rows: LeaderboardRow[] = [];
    for (const key of keys) {
      const run = runs[key];
      if (!run) continue;
      const names = Object.keys(run);
      for (const [name, r] of Object.entries(run)) {
        if (typeof r.final_value !== 'number') continue;
        const others = names.filter((n) => n !== name).map((n) => n.replace(/\s*\(.*\)$/, ''));
        const effort = name.match(/^(.*) \((\w+) reasoning\)$/);
        rows.push({
          model: effort ? effort[1] : name,
          score: Math.round(r.final_value * 100) / 100,
          setting: [effort ? `${effort[2].toLowerCase()} reasoning` : '', `vs ${others.join(', ')}`].filter(Boolean).join(', '),
        });
      }
    }
    if (rows.length < 20) throw new Error(`only ${rows.length} arena rows`);
    return rows;
  },
};
export default board;
