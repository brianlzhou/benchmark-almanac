// APEX-Accounting: the primary ranking is mean rubric score (0-100), not full-task Pass@1.
// Read every model/harness row from the official Next.js payload. Other pass metrics and intervals stay secondary.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://www.mercor.com/apex/apex-accounting-leaderboard/';
interface Run {model_name: string; model_id: string; company?: string; effort?: string; score: Record<string, Record<string, number>>; error?: Record<string, Record<string, number>>}
const board: Leaderboard = {
 benchmark: 'apex-accounting', measures: { passAt1: 'pass-1' }, url: PAGE, feed: `${PAGE} (__NEXT_DATA__.props.pageProps.leaderboard.rows)`,
 chart: {title: 'Cost vs. Performance', x: {key: 'cost', label: 'Average cost per run', unit: '$', better: 'lower'}, y: {key: 'score', label: 'Mean score', unit: '%', better: 'higher'}, note: 'Mercor plots mean score against average cost per run.'},
 terms: 'Mercor terms prohibit scraping; the almanac credits Mercor and links the original source.',
 stats: {
  tokensPerRun: { name: 'Tokens per run', unit: 'tokens' },
  passAt2: { name: 'Pass@2', unit: '%', better: 'higher' },
  passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
  passAt4: { name: 'Pass@4', unit: '%', better: 'higher' },
  pass2: { name: 'Pass^2', unit: '%', better: 'higher' },
  pass3: { name: 'Pass^3', unit: '%', better: 'higher' },
  pass4: { name: 'Pass^4', unit: '%', better: 'higher' },
 },
 aliases: {'Muse Wonder 1.0': 'muse-wonder'},
 async fetch() {
  const html = await fetchText(PAGE);
  const payload = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!payload) throw new Error('Mercor Next.js payload missing');
  const data = JSON.parse(payload).props.pageProps;
  if (!data.path.includes('apex-accounting')) throw new Error('Unexpected Mercor benchmark');
  const rows: LeaderboardRow[] = [];
  const resources = new Map<string, {costPerRun?: number; tokensPerRun?: number; passCurve?: {passAtK?: number[]; passHatK?: number[]}; model?: {releaseType?: string}}>((data.results ?? []).map((r: any) => [r.modelId, r]));
  for (const r of data.leaderboard.rows as Run[]) for (const [harness, score] of Object.entries(r.score['mean-score'] ?? {})) {
   if (!Number.isFinite(score)) continue;
   const metrics: Record<string, number> = {};
   for (const [key, scores] of Object.entries(r.score)) if (key !== 'mean-score' && typeof scores[harness] === 'number') metrics[key === 'pass-1' ? 'passAt1' : key] = scores[harness];
   const error = r.error?.['mean-score']?.[harness];
   let low: number | undefined, high: number | undefined;
   if (typeof error === 'number') {low = score - error; high = score + error; metrics.ciLow = low; metrics.ciHigh = high;}
   const model = r.company === 'claude' && !r.model_name.startsWith('Claude') ? `Claude ${r.model_name}` : r.model_name;
   const resource = resources.get(r.model_id);
   const cost = typeof resource?.costPerRun === 'number' && Number.isFinite(resource.costPerRun) ? resource.costPerRun : undefined;
   // The source reports total tokens per run (not output-only), so keep tokensPerRun in metrics.
   if (typeof resource?.tokensPerRun === 'number') metrics.tokensPerRun = resource.tokensPerRun;
   const passAtK = resource?.passCurve?.passAtK;
   if (Array.isArray(passAtK)) for (let k = 2; k <= 4; k++) if (typeof passAtK[k - 1] === 'number' && Number.isFinite(passAtK[k - 1])) metrics[`passAt${k}`] = passAtK[k - 1];
   const passHatK = resource?.passCurve?.passHatK;
   if (Array.isArray(passHatK)) for (let k = 2; k <= 4; k++) if (typeof passHatK[k - 1] === 'number' && Number.isFinite(passHatK[k - 1])) metrics[`pass${k}`] = passHatK[k - 1];
   const rt = resource?.model?.releaseType;
   const open = rt === 'open' || rt === 'open-weights' ? true : rt === 'proprietary' ? false : undefined;
   rows.push({model, score, setting: r.effort, harness, cost, low, high, open, metrics});
  }
  if (!rows.length) throw new Error('APEX-Accounting mean scores missing');
  return rows;
 },
};
export default board;
