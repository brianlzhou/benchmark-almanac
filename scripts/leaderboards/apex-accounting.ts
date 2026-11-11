// APEX-Accounting: the primary ranking is mean rubric score (0-100), not full-task Pass@1.
// Read every model/harness row from the official Next.js payload. Other pass metrics and intervals stay secondary.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://www.mercor.com/apex/apex-accounting-leaderboard/';
interface Run {model_name: string; model_id: string; company?: string; effort?: string; score: Record<string, Record<string, number>>; error?: Record<string, Record<string, number>>}
const board: Leaderboard = {
 benchmark: 'apex-accounting', url: PAGE, feed: `${PAGE} (__NEXT_DATA__.props.pageProps.leaderboard.rows)`,
 chart: {title: 'Cost vs. Performance', x: {key: 'costPerRun', label: 'Source cost per run', unit: '$', better: 'lower'}, y: {key: 'score', label: 'Mean score', unit: '%', better: 'higher'}, note: 'Mercor costPerRun values are preserved without assuming a per-task denominator.'},
 terms: 'Mercor terms prohibit scraping; the almanac credits Mercor and links the original source.',
 aliases: {'Muse Wonder 1.0': 'muse-wonder'},
 async fetch() {
  const html = await fetchText(PAGE);
  const payload = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!payload) throw new Error('Mercor Next.js payload missing');
  const data = JSON.parse(payload).props.pageProps;
  if (!data.path.includes('apex-accounting')) throw new Error('Unexpected Mercor benchmark');
  const rows: LeaderboardRow[] = [];
  const resources = new Map<string, {costPerRun?: number; tokensPerRun?: number}>((data.results ?? []).map((r: any) => [r.modelId, r]));
  for (const r of data.leaderboard.rows as Run[]) for (const [harness, score] of Object.entries(r.score['mean-score'] ?? {})) {
   if (!Number.isFinite(score)) continue;
   const metrics: Record<string, number> = {};
   for (const [key, scores] of Object.entries(r.score)) if (key !== 'mean-score' && typeof scores[harness] === 'number') metrics[key] = scores[harness];
   const error = r.error?.['mean-score']?.[harness];
   if (typeof error === 'number') {metrics.ciLow = score-error; metrics.ciHigh = score+error;}
   const model = r.company === 'claude' && !r.model_name.startsWith('Claude') ? `Claude ${r.model_name}` : r.model_name;
   const resource = resources.get(r.model_id);
   // The source does not establish output-only tokens or a per-task denominator.
   if (typeof resource?.costPerRun === 'number') metrics.costPerRun = resource.costPerRun;
   if (typeof resource?.tokensPerRun === 'number') metrics.tokensPerRun = resource.tokensPerRun;
   rows.push({model, score, setting: r.effort, harness, metrics});
  }
  if (!rows.length) throw new Error('APEX-Accounting mean scores missing');
  return rows;
 },
};
export default board;
