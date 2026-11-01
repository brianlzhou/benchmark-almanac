// Vals Index on vals.ai. Each vals.ai benchmark page is server-rendered HTML whose first table is the
// leaderboard: Rank | Model | Accuracy | Cost / Test | (Tokens / Test) | Duration / Test. Accuracy is the
// score and Cost / Test the cost per task. Tokens / Test counts input and output, so it is not kept. Each
// model links to /models/<slug>; a slug ending in "-thinking" marks a thinking run whose name does not say
// so, and that becomes the setting. The other Vals importers (vals-finance-agent, vals-finance-agent-v2,
// immigration-bench) read their pages through valsRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

export const valsPage = (slug: string) => `https://www.vals.ai/benchmarks/${slug}`;
export const VALS_TERMS =
  'Server-rendered page on vals.ai: the site publishes no terms of use, robots.txt allows these pages, and the footer reserves all rights, so scores are cited to Vals AI.';

export async function valsRows(slug: string): Promise<LeaderboardRow[]> {
  const html = await fetchText(valsPage(slug));
  const [t] = tables(html);
  const head = t?.[0]?.map((c) => c.text);
  const col = (name: string) => head?.findIndex((h) => h === name) ?? -1;
  const [model, accuracy, cost] = [col('Model'), col('Accuracy'), col('Cost / Test')];
  if (model < 0 || accuracy < 0) throw new Error(`unexpected Vals header on ${slug}: ${head?.join(' | ')}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    const cell = r[model];
    const score = num(r[accuracy]?.text);
    if (!cell?.text || score === undefined) continue;
    const href = cell.html.match(/href="\/models\/([^"]+)"/)?.[1] ?? '';
    let name = cell.text.replace(/\(Nonthinking\)/i, '(non-thinking)');
    // "GPT 4o (2024-08-06)": a snapshot date, passed on so the resolver picks that snapshot
    const stamp = name.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
    if (stamp) name = name.slice(0, stamp.index).trim();
    // "Gemini 3 Pro (11/25)": the month Vals ran the preview, not part of the name
    name = name.replace(/\s*\(\d\d\/\d\d\)$/, '').trim();
    // "Grok 4.1 Fast Non-Reasoning": the mode as a bare suffix
    const off = name.match(/\s+Non-Reasoning$/i);
    if (off) name = name.slice(0, off.index).trim();
    const thinking = /-thinking$/.test(href) && !/think|reason/i.test(name) ? 'thinking' : undefined;
    const setting = off ? 'non-reasoning' : thinking;
    rows.push({ model: name, score, setting, cost: cost >= 0 ? num(r[cost]?.text) : undefined, date: stamp?.[1] });
  }
  if (!rows.length) throw new Error(`no rows on the Vals ${slug} page`);
  return rows;
}

/** Vals display names the shared resolver cannot place. */
export const VALS_ALIASES: Record<string, string> = {
  Wonder: 'muse-wonder',
  'GPT 4o': 'gpt-4o-aug-2024',
  'Gemini 3 Pro': 'gemini-3-pro',
  'Gemini 3 Flash': 'gemini-3-flash',
  'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  'Gemini 3.1 Flash Lite Preview': 'gemini-3-1-flash-lite',
  'Qwen 3.5 Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  'Qwen 3.5 Flash': 'qwen-3-5-flash-hosted-35b-a3b',
  'Qwen 3.8 Max 0902': 'qwen3-8-max-0902',
  'DeepSeek V4': 'deepseek-v4-pro',
  'Command A': 'cohere-command-a',
};

const board: Leaderboard = {
  benchmark: 'vals-index',
  url: valsPage('vals_index'),
  feed: `${valsPage('vals_index')} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows('vals_index'),
};
export default board;
