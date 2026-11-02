// CAIS Text Capabilities Index on the CAIS AI Dashboard (dashboard.safe.ai). The dashboard is a Next.js page
// with no data API: its model list ships in one of the page's JS chunks as a JSON.parse('[...]') literal, one
// object per model with `scores` keyed by dataset id (hle, textquests, erqa, masks, pct...). The page computes
// each index in the browser as the plain mean of the section's datasets that a model has, after flipping the
// two "higher is safer" risk datasets (MASK honesty and the bio refusal average) to 100 minus the score. The
// readers below reproduce that mean, rounded to one decimal like the table. Section members are listed here
// (as of 2026-11-01) and checked against the data, since the section definitions live in compiled code.
// The model id carries the reasoning effort ("gemini-4-argon-high"), which is passed as the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const CAIS_PAGE = 'https://dashboard.safe.ai/';
export const CAIS_TERMS =
  'Public dashboard page; dashboard.safe.ai robots.txt sets no rules or content signals, and the data ships in the page\'s own JS chunk.';

export interface CaisModel {
  name: string;
  id: string;
  provider: string;
  scores: Record<string, number | null>;
  model_size?: string;
  isTextOnlyModel?: boolean;
  releaseDate?: string;
}

/** The dashboard's model list, read from whichever page chunk carries it. */
export async function caisModels(): Promise<CaisModel[]> {
  const html = await fetchText(CAIS_PAGE);
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[\w-]+\.js/g)].map((m) => m[0]))];
  for (const c of chunks) {
    const js = await fetchText(new URL(c, CAIS_PAGE).href);
    const at = js.indexOf(`JSON.parse('[{"name"`);
    if (at < 0 || !js.includes('"scores"')) continue;
    const start = at + "JSON.parse('".length;
    let i = start;
    while (i < js.length && js[i] !== "'") i += js[i] === '\\' ? 2 : 1;
    return JSON.parse(js.slice(start, i).replace(/\\(['\\])/g, '$1')) as CaisModel[];
  }
  throw new Error('model data chunk not found');
}

/**
 * Dashboard names the resolver places on the wrong snapshot or cannot place. The dashboard's own model ids
 * and release dates decide: "GPT-4o" is gpt-4o-2024-11-20, "Gemini 2.5 Flash" the June 2025 GA release,
 * "Gemini 2.5 Pro-Exp" the March 2025 preview, "Kimi K2" is kimi-k2-thinking, "Grok 4.2" is Grok 4.20.
 */
export const CAIS_ALIASES: Record<string, string> = {
  'GPT-4o': 'gpt-4o-nov-2024',
  'Gemini 2.5 Pro-Exp': 'gemini-2-5-pro-mar-2025',
  'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
  'Gemini 2.5 Flash-Lite': 'gemini-2-5-flash-lite-jun-2025',
  'DeepSeek R1': 'deepseek-r1',
  'DeepSeek 3.2': 'deepseek-v3-2',
  'DeepSeek 4 Pro': 'deepseek-v4-pro',
  'Kimi K2': 'kimi-k2-thinking',
  'Grok 4.2': 'grok-4-20',
  'Sonnet 3.7': 'claude-3-7-sonnet',
};

const EFFORT = /-(minimal|low|medium|high|xhigh|max)$/;

/**
 * One dashboard index: the mean of `datasets` a model has (ids in `flip` count as 100 minus the score),
 * rounded to one decimal, as the dashboard table shows it.
 */
export async function caisIndexRows(datasets: string[], flip: string[] = [], skip?: (m: CaisModel) => boolean): Promise<LeaderboardRow[]> {
  const models = await caisModels();
  const known = new Set(models.flatMap((m) => Object.keys(m.scores)));
  const missing = datasets.filter((d) => !known.has(d));
  if (missing.length) throw new Error(`dataset ids not in the data: ${missing.join(', ')}`);
  const rows: LeaderboardRow[] = [];
  for (const m of models) {
    if (skip?.(m)) continue;
    const xs = datasets
      .map((d) => (typeof m.scores[d] === 'number' ? (flip.includes(d) ? 100 - m.scores[d]! : m.scores[d]!) : null))
      .filter((x): x is number => x !== null);
    if (!xs.length) continue;
    const setting = m.id.match(EFFORT)?.[1] ?? (/-thinking/.test(m.id) ? 'thinking' : undefined);
    rows.push({ model: m.name, score: Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)), setting });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'cais-text-capabilities-index',
  url: CAIS_PAGE,
  feed: `${CAIS_PAGE} (page JS chunk, mean of hle and textquests)`,
  terms: CAIS_TERMS,
  aliases: CAIS_ALIASES,
  fetch: () => caisIndexRows(['hle', 'textquests']),
};
export default board;
