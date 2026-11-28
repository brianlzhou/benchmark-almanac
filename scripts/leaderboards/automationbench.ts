// AutomationBench (Zapier). The Framer page renders the top ten configurations in HTML, but its page module
// contains every ranked row behind "See more". Follow the current script_main route to the /benchmarks module
// and read its literal leaderboard rows, department results, price notes and model reports.
// Check the expanded count against the HTML so a changed bundle cannot silently truncate the leaderboard.
// Zapier's terms of service and acceptable use policy set no rule
// against automated reading. The official score is the pass rate on Zapier's held-out private task set.
// The fourth cell, "Cost / task" in US dollars at standard list pricing (an asterisk marks models that also
// have promotional pricing), is the cost.
//
// Names carry the setting in parentheses: "GPT-6 Astra (XHigh)", "Claude Opus 5.5 (default fallbacks,
// Max)". The last part is the effort; anything before it ("default fallbacks") is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://zapier.com/benchmarks';
const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'none', 'between tools']);

const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .trim();

const board: Leaderboard = {
  benchmark: 'automationbench',
  url: PAGE,
  feed: `${PAGE} (current Framer page module, all ranked leaderboard rows)`,
  terms: "Static page on zapier.com; Zapier's terms of service and acceptable use policy do not restrict automated reading.",
  stats: { promotionalCostUsd:{name:'Promotional cost per task',unit:'usd',better:'lower'}, uncachedCostUsd:{name:'Uncached cost per task',unit:'usd',better:'lower'}, cachedCostUsd:{name:'Cached cost per task',unit:'usd',better:'lower'} },
  parts: Object.fromEntries(['Sales', 'Marketing', 'Operations', 'Support', 'Finance', 'HR'].map(name => [name, { name, group: 'Department' }])),
  aliases: { 'Gemini 3.1 Pro (preview)': 'gemini-3-1-pro' },
  async fetch() {
    const html = await fetchText(PAGE);
    const main = html.match(/<script\b[^>]*src="([^"]*\/script_main\.[^"]+\.mjs)"/)?.[1];
    if (!main) throw new Error('AutomationBench main module missing');
    const routes = await fetchText(main);
    const page = routes.match(/page:[^{}]*?import\(`([^`]+)`\)\),path:`\/benchmarks`/)?.[1];
    if (!page) throw new Error('AutomationBench page route missing');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const source = await fetchText(new URL(page, main).href);
    const reports = [...source.matchAll(/\{label:`([^`]+)`,link:`(\/benchmarks\/[^`]+)`\}/g)];
    const departments = new Map<string, Record<string, number>>();
    for (const [, dept, winner, score, runner] of source.matchAll(/\[`([^`]+)`,`([^`]+ — [^`]+)`,`([\d.]+)%`,`([^`]+)`\]/g)) {
      const save = (name: string, value: string) => {
        const model = name.split(' — ')[0].trim();
        const metrics = departments.get(model) ?? {};
        metrics[dept] = Number(value);
        departments.set(model, metrics);
      };
      save(winner, score);
      const other = runner.match(/^(.+ — .+) \((?:tie at )?([\d.]+)%\)$/);
      if (other) save(other[1], other[2]);
    }
    // The optional range column uses a Wilson interval with the task count and z value in the module.
    const constants = source.match(/,\w+=(\d+),\w+=\{Sales:\d+,[^}]+\},\w+=[.\d]+,\w+=([.\d]+),\w+=\w+=>parseFloat/);
    const promotional = new Map<string, number>();
    const note = source.match(/ranking and Cost \/ task use standard list pricing\. ([^`]+)/)?.[1] ?? '';
    for (const [, model, prices] of note.matchAll(/(?:^|\. )([^:$]+?): (\$[^`]*?)(?=\. [A-Z]|\.$|$)/g)) {
      for (const [, amount, effort] of prices.matchAll(/\$([\d.]+)(?: \(([^)]+)\))?/g)) {
        promotional.set(effort ? `${model} (${effort})` : model, Number(amount));
      }
    }
    const rows: LeaderboardRow[] = [];
    const ranked = [...source.matchAll(/\[(\d+),`([^`]+)`,`([\d.]+%)`,`(\$[\d.]+[\*†‡]?)`\]/g)];
    const more = html.match(/See (\d+) more/);
    const visible = html.split('<div class="abp-row"').slice(1).filter((chunk) => {
      const cells = [...chunk.slice(0, 8000).matchAll(/<span style="font-family[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
      return /^\d+$/.test(cells[0] ?? '') && /%$/.test(cells[2] ?? '');
    }).length;
    if (ranked.length !== visible + Number(more?.[1] ?? 0)) throw new Error(`AutomationBench count changed: ${ranked.length} module rows versus ${visible} visible plus ${more?.[1] ?? 0}`);
    for (const [index, tuple] of ranked.entries()) {
      const [, rank, rawName, score, price] = tuple;
      const name = rawName.replace(/[†‡§*]+$/, '').trim();
      if (Number(rank) !== index + 1) throw new Error('AutomationBench ranks are not contiguous');
      const paren = name.match(/^(.*?)\s*\(([^)]*)\)$/);
      let model = name;
      let setting: string | undefined;
      let harness: string | undefined;
      if (paren) {
        const parts = paren[2].split(',').map((p) => p.trim());
        const last = parts.at(-1)!.toLowerCase();
        if (EFFORTS.has(last)) {
          model = paren[1];
          setting = last;
          harness = parts.slice(0, -1).join(', ') || undefined;
        }
      }
      const cost = parseFloat(price?.match(/^\$\s*([\d.]+)/)?.[1] ?? '');
      const metrics: Record<string, number> = { ...departments.get(name) };
      const promo = price.endsWith('*') ? promotional.get(name) ?? promotional.get(model) : undefined;
      if (promo !== undefined) metrics.promotionalCostUsd = promo;
      const cachedPrice = source.match(/DeepSeek V4 Flash at Fireworks rates: \$([\d.]+) \/ task uncached, \$([\d.]+) cached/);
      if (price.endsWith('‡') && cachedPrice) {
        metrics.uncachedCostUsd = Number(cachedPrice[1]);
        metrics.cachedCostUsd = Number(cachedPrice[2]);
      }
      const report = reports.find(([, label]) => name === label || name.startsWith(label + ' ('));
      const row: LeaderboardRow = { model, score: parseFloat(score), setting, harness, metrics,
        link: report ? new URL(report[2], PAGE).href : undefined, cost: Number.isFinite(cost) && cost > 0 ? cost : undefined };
      if (constants) {
        const n = Number(constants[1]), z = Number(constants[2]), p = row.score / 100;
        if (n > 0 && z > 0) {
          const denominator = 1 + z * z / n;
          const center = (p + z * z / (2 * n)) / denominator;
          const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denominator;
          row.low = Number((Math.max(0, center - half) * 100).toFixed(1));
          row.high = Number((Math.min(1, center + half) * 100).toFixed(1));
        }
      }
      rows.push(row);
    }
    if (!rows.length) throw new Error('no leaderboard rows found; the page layout may have changed');
    return rows;
  },
};
export default board;
