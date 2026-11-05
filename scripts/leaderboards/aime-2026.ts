// AIME 2026 on MathArena. The matharena.ai page loads each competition's table from
// /competition_tables/<id>, a JSON object whose "table" field is the server-rendered results table.
// MathArena publishes no results file (its GitHub repo has code only, and the Hugging Face *_outputs
// datasets lag the site), so the importer reads that table. The other MathArena importers reuse
// matharenaRows from this file. Besides cost and output tokens per answer, each row keeps the table's
// "Average Time" per answer (metrics.latency, seconds) and the accuracy's 95% interval (metrics.ciLow, ciHigh).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const matharenaFeed = (comp: string) => `https://matharena.ai/competition_tables/${comp}`;
export const matharenaPage = (comp: string) => `https://matharena.ai/?comp=${comp}`;
export const MATHARENA_TERMS =
  'matharena.ai publishes no terms and no robots.txt; the code is MIT and the Hugging Face datasets are CC BY-NC-SA 4.0.';

const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/⚠️/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * One row per model in the competition's main table, with "Accuracy" as the score (0 to 100).
 * Rows marked data-predicted="yes" include item-response-theory estimates for unrun questions; they are skipped.
 */
export async function matharenaRows(comp: string): Promise<LeaderboardRow[]> {
  const { table } = await fetchJson<{ table: string }>(matharenaFeed(comp));
  const head = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((h) => text(h[1]));
  const timeCol = head.indexOf('Average Time');
  const rows: LeaderboardRow[] = [];
  for (const m of table.matchAll(/<tr class="model-row"([\s\S]*?)<\/tr>/g)) {
    const tr = m[1];
    const name = tr.match(/<a class="model-link"[^>]*>([\s\S]*?)<\/a>/);
    const acc = tr.match(/metric-bar-cell--accuracy[^>]*?data-predicted="(\w+)"[^>]*>([\s\S]*?)<\/td>/);
    if (!name || !acc) continue;
    if (acc[1] !== 'no') continue;
    const pct = text(acc[2]).match(/^(-?[\d.]+)%/);
    if (!pct) continue;
    // "Cost in USD for one model run on one problem" and "Average number of output tokens per answer"
    const cell = (kind: string) => {
      const c = tr.match(new RegExp(`metric-bar-cell--${kind}"[^>]*>([\\s\\S]*?)<\\/td>`));
      const v = c && text(c[1]).replace(/[$,]/g, '').match(/^[\d.]+/);
      return v ? Number(v[0]) : undefined;
    };
    let model = text(name[1]);
    let setting: string | undefined;
    let harness: string | undefined;
    // "GPT-5 (High) Agent": the model inside MathArena's agent scaffold
    if (/\sAgent$/.test(model)) {
      harness = 'MathArena agent';
      model = model.replace(/\s+Agent$/, '');
    }
    // "Kimi K3 (Think)": MathArena's label for thinking mode
    const think = model.match(/\s*\(Think\)$/i);
    if (think) {
      setting = 'thinking';
      model = model.slice(0, think.index);
    }
    const score = Number(pct[1]);
    const metrics: Record<string, number> = {};
    // "100.00% ± 0.00%": a 95% normal-approximation interval, kept within 0 to 100
    const ci = text(acc[2]).match(/±\s*([\d.]+)%/);
    if (ci) Object.assign(metrics, { ciLow: Math.max(0, +(score - Number(ci[1])).toFixed(2)), ciHigh: Math.min(100, +(score + Number(ci[1])).toFixed(2)) });
    // "Average time taken per answer", such as "1m 50s" or "118m 13s"; "—" when not recorded
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1]));
    const time = timeCol >= 0 && tds.length === head.length ? tds[timeCol].match(/^(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+(?:\.\d+)?)s)?$/) : null;
    if (time && time[0]) metrics.latency = 3600 * Number(time[1] ?? 0) + 60 * Number(time[2] ?? 0) + Number(time[3] ?? 0);
    rows.push({
      model,
      score,
      setting,
      harness,
      cost: cell('cost'),
      tokens: cell('tokens'),
      metrics: Object.keys(metrics).length ? metrics : undefined,
    });
  }
  if (!rows.length) throw new Error(`no rows in ${comp}`);
  return rows;
}

/** MathArena's spellings that the shared resolver cannot place; every MathArena importer uses these. */
export const MATHARENA_ALIASES: Record<string, string> = {
  'Gemini 3 Pro (preview)': 'gemini-3-pro',
  'NVIDIA-Nemotron-3-Super': 'nemotron-3-super',
  'Grok 4 Fast R': 'grok-4-fast',
  'Qwen3-235B-2507-Think': 'qwen3-235b-a22b-thinking-jul-2025',
  'Qwen3-30B-A3B-2507-Think': 'qwen3-30b-a3b-thinking-jul-2025',
  'DeepSeek-R1-0528': 'deepseek-r1-may-2025',
  // config deepseek/deepseek_r1, the January 2025 model (the 0528 update has its own row)
  'DeepSeek-R1': 'deepseek-r1',
  'DeepSeek-R1-Distill-1.5B': 'deepseek-r1-distill-qwen-1-5b',
  'DeepSeek-R1-Distill-14B': 'deepseek-r1-distill-qwen-14b',
  'DeepSeek-R1-Distill-32B': 'deepseek-r1-distill-qwen-32b',
  'DeepSeek-R1-Distill-70B': 'deepseek-r1-distill-llama-70b',
  'Gemini 2.5 Pro (05-06)': 'gemini-2-5-pro-may-2025',
};

/**
 * On the 2025 competitions MathArena ran in spring 2025, plain "Gemini 2.5 Pro" (config gemini-pro-2.5) is
 * the March 2025 model: those tables list the 05-06 update as a separate row. Later tables (IMO 2025) ran
 * after the June GA release, which the shared resolver picks by default.
 */
export const MATHARENA_SPRING_2025_ALIASES: Record<string, string> = {
  ...MATHARENA_ALIASES,
  'Gemini 2.5 Pro': 'gemini-2-5-pro-mar-2025',
};

const COMP = 'aime--aime_2026';

const board: Leaderboard = {
  benchmark: 'aime-2026',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
