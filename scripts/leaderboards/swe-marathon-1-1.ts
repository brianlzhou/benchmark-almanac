// SWE-Marathon v1.1 (Abundant AI). swe-marathon.org is a Vite app; its one bundle (/assets/index-<hash>.js)
// holds every v1.1 trial as `version:`v1.1`,tasks:JSON.parse(`{...}`)`: per task, per agent and model
// configuration, the trials with a binary reward. The page builds the board from that data in a few
// documented steps, which this reader repeats: it drops the models the page lists as hidden (a Set of model
// names read from the same bundle), groups trials by agent, model and reasoning effort (no effort means
// "max"), shows only the max effort for a model that has one, and scores each group as the share of trials
// with reward 1 (pass@1, 0 to 100). Cost is the mean trial cost in US dollars. The row date is the first
// trial's start. The v1.0 archive board is a static array in the same bundle (swe-marathon.ts).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

export const SWEM_PAGE = 'https://www.swe-marathon.org/';
export const SWEM_TERMS = 'Public site of the SWE-Marathon benchmark; robots.txt allows all paths and the site publishes no terms of use.';

/** The page's script bundle (its name carries a content hash). */
export async function swemBundle(): Promise<{ url: string; js: string }> {
  const html = await fetchText(SWEM_PAGE);
  const path = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
  if (!path) throw new Error('SWE-Marathon bundle not found in the page');
  const url = new URL(path, SWEM_PAGE).href;
  return { url, js: await fetchText(url) };
}

/** A minified-JS array or object literal with backtick strings, read as data (never run). */
export function backtickLiteral<T>(s: string, from: number): T {
  let out = '';
  let code = '';
  // code between strings: unquoted keys, !0 / !1 and bare decimals such as .58 become JSON
  const flush = () => {
    out += code
      .replace(/!0\b/g, 'true')
      .replace(/!1\b/g, 'false')
      .replace(/([{,])([A-Za-z_$][\w$]*):/g, '$1"$2":')
      .replace(/([:,[])(-?)\.(\d)/g, '$1$20.$3');
    code = '';
  };
  let depth = 0;
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (c === '`' || c === '"') {
      let j = i + 1;
      while (s[j] !== c) j += s[j] === '\\' ? 2 : 1;
      flush();
      out += c === '`' ? JSON.stringify(s.slice(i + 1, j)) : s.slice(i, j + 1);
      i = j;
      continue;
    }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    code += c;
    if (depth === 0) break;
  }
  flush();
  return JSON.parse(out) as T;
}

interface Trial {
  reward: number;
  costUsd?: number | null;
  startedAt?: string;
}
interface Config {
  agent: string;
  model: string;
  reasoningEffort?: string;
  trials: Trial[];
}

const BASE = { benchmark: 'swe-marathon-1-1', url: SWEM_PAGE, terms: SWEM_TERMS };

const board: Leaderboard = {
  ...BASE,
  feed: `${SWEM_PAGE}assets/index-<hash>.js (v1.1 trial data; pass@1 per agent, model and effort)`,
  async fetch() {
    const { js } = await swemBundle();
    const at = js.search(/version:`v1\.1`,tasks:JSON\.parse\(`/);
    if (at < 0) throw new Error('v1.1 task data not found in the SWE-Marathon bundle');
    const start = js.indexOf('JSON.parse(`', at) + 'JSON.parse(`'.length;
    let end = start;
    while (js[end] !== '`') end += js[end] === '\\' ? 2 : 1;
    const raw = js.slice(start, end).replace(/\\([`\\$])/g, '$1');
    const tasks = jsonAt<Record<string, { configs: Config[] }>>(raw, 0);
    // the page hides older models: `X=new Set([...]),Y=e=>X.has(e.model)`
    const hiddenSrc = js.match(/(\w+)=new Set\(\[([^\]]*)\]\),\w+=\w+=>\1\.has\(\w+\.model\)/)?.[2];
    if (hiddenSrc === undefined) throw new Error('hidden-model list not found in the SWE-Marathon bundle');
    const hidden = new Set([...hiddenSrc.matchAll(/`([^`]*)`/g)].map((m) => m[1]));
    const groups = new Map<string, { agent: string; model: string; effort: string; named: boolean; trials: Trial[] }>();
    for (const t of Object.values(tasks)) {
      for (const c of t.configs) {
        if (hidden.has(c.model)) continue;
        const effort = c.reasoningEffort || 'max';
        const k = `${c.agent}\u0000${c.model}\u0000${effort}`;
        const g = groups.get(k) ?? { agent: c.agent, model: c.model, effort, named: !!c.reasoningEffort, trials: [] };
        g.trials.push(...c.trials);
        groups.set(k, g);
      }
    }
    const hasMax = new Set([...groups.values()].filter((g) => g.effort === 'max').map((g) => `${g.agent}\u0000${g.model}`));
    const rows: LeaderboardRow[] = [];
    for (const g of groups.values()) {
      if (!g.trials.length) continue;
      if (g.effort !== 'max' && hasMax.has(`${g.agent}\u0000${g.model}`)) continue;
      const costs = g.trials.map((t) => t.costUsd).filter((c): c is number => typeof c === 'number');
      const starts = g.trials.map((t) => t.startedAt?.slice(0, 10)).filter((d): d is string => !!d && /^\d{4}-\d\d-\d\d$/.test(d)).sort();
      rows.push({
        model: g.model,
        score: Number(((100 * g.trials.filter((t) => t.reward >= 1).length) / g.trials.length).toFixed(1)),
        // the page treats a missing effort as max but labels it without one
        setting: g.named ? g.effort : undefined,
        harness: g.agent,
        date: starts[0],
        cost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : undefined,
      });
    }
    return rows;
  },
};
export default board;
