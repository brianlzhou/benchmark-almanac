// Vending-Bench 2 (Andon Labs). andonlabs.com is a prerendered SvelteKit site. The page's "Current
// leaderboard" table is built from a JS data module (runs.vb2: one entry per model with final_value, the
// mean money balance in USD after the simulated year, plus SEM, geomean and the daily time series). The
// module's file name is a build hash, so the importer reads the page, follows the page's own node chunks to
// the modules they import, and takes the one that holds the vb2 runs (now a JSON.parse(`{"vb2":...}`) string,
// earlier a bare `vb2:{` literal). The headline is the mean final balance, the table's default metric.
// The page node also holds the data of its "Score vs. cost per run" chart: per model mean_cost, the US dollars
// of one run (the whole simulated year, priced from the run's tokens without caching), and
// avg_output_tokens for one run. One run is the whole test, so the board sets costPer 'run'; the output tokens
// are per run too. The table's standard error of the mean balance is kept as metrics.sem.
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
    if (c === '"' || c === "'" || c === '`') {
      k = js.indexOf(c, k + 1);
      if (k < 0) break;
    }
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

interface Run {
  final_value?: number;
  final_value_sem?: number;
}

/** The vb2 runs and, by model, the cost and output tokens of one run, from the page's node and chunk modules. */
async function load(): Promise<{ runs: Record<string, Run>; costs: Map<string, { cost?: number; tokens?: number }> }> {
  const html = await fetchText(PAGE);
  const nodes = [...new Set([...html.matchAll(/_app\/immutable\/(nodes\/[\w.-]+\.js)/g)].map((m) => m[1]))];
  const nodeJs = await Promise.all(nodes.map((n) => fetchText(BASE + n)));
  const imported = new Set<string>();
  for (const node of nodeJs) {
    for (const m of node.matchAll(/from"\.\.\/chunks\/([\w.-]+\.js)"/g)) imported.add(`chunks/${m[1]}`);
  }
  const chunks = await Promise.all([...imported].map((c) => fetchText(BASE + c)));
  let runs: Record<string, Run> | undefined;
  for (const js of [...nodeJs, ...chunks]) {
    const str = js.indexOf('JSON.parse(`{"vb2":{');
    if (str >= 0) {
      const from = str + 'JSON.parse(`'.length;
      // the JSON sits in a template literal: undo its escapes, never evaluate it
      const data = JSON.parse(js.slice(from, js.indexOf('`)', from)).replace(/\\\\/g, '\\').replace(/\\`/g, '`')) as { vb2: Record<string, Run> };
      runs = data.vb2;
      break;
    }
    const lit = js.indexOf('vb2:{"');
    if (lit >= 0) {
      runs = JSON.parse(toJson(objectAt(js, lit))) as Record<string, Run>;
      break;
    }
  }
  if (!runs) throw new Error('no module with runs.vb2 found');
  // "Claude Fable 5 - High":{provider:`Anthropic`,n:5,mean_cost:1369.26,...,avg_output_tokens:311605,...}
  const costs = new Map<string, { cost?: number; tokens?: number }>();
  for (const js of [...nodeJs, ...chunks]) {
    for (const m of js.matchAll(/"([^"]+)":\{([^{}]*?\bmean_cost:[^{}]*)\}/g)) {
      const field = (k: string) => Number(m[2].match(new RegExp(`\\b${k}:(-?[\\d.]+)`))?.[1]);
      const [cost, tokens] = [field('mean_cost'), field('avg_output_tokens')];
      costs.set(m[1], { cost: cost > 0 ? cost : undefined, tokens: tokens > 0 ? tokens : undefined });
    }
  }
  return { runs, costs };
}

const board: Leaderboard = {
  benchmark: 'vending-bench-2',
  url: PAGE,
  feed: `${BASE}chunks/<hash>.js (the runs.vb2 data module the page imports) and nodes/<n>.<hash>.js (mean_cost per run)`,
  terms: 'Public static asset of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    // the registry names the hosted Qwen 3.5 Plus by its weights
    'Qwen 3.5 Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  },
  costPer: 'run',
  chart: {
    title: 'Score vs. cost per run',
    note: 'Final money balance against mean API cost for the whole simulated year, without caching.',
    x: { key: 'cost', label: 'Cost per run', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Mean final money balance', unit: '$', better: 'higher' },
  },
  async fetch() {
    const { runs, costs } = await load();
    const rows: LeaderboardRow[] = [];
    for (const [name, r] of Object.entries(runs)) {
      if (typeof r.final_value !== 'number') continue;
      const spend = costs.get(name);
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
      rows.push({
        model,
        score: r.final_value,
        setting,
        harness,
        cost: spend?.cost,
        tokens: spend?.tokens,
        metrics: typeof r.final_value_sem === 'number' ? { sem: r.final_value_sem } : undefined,
      });
    }
    return rows;
  },
};
export default board;
