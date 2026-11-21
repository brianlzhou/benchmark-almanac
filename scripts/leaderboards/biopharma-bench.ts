// Biopharma Bench V0.2 scores mean rubric fulfillment across 81 tasks.
// The Full passes column reports pass@1 and its margin.
// Cost is USD per task, output time converts minutes to seconds, and full-pass counts remain secondary.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://eval.raycaster.ai/benchmarks/biopharma-bench/";
const board: Leaderboard = {
 benchmark: "biopharma-bench", url: "https://eval.raycaster.ai/benchmarks/biopharma-bench/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, passAt1: { name: 'Pass@1', unit: '%', better: 'higher' }, passAt1Margin: { name: 'Pass@1 margin', unit: '%' }, steps: { name: 'Steps', unit: 'count' }, toolCalls: { name: 'Tool calls', unit: 'count' } },
 aliases:{'Muse Wonder 1.0':'muse-wonder'},
 chart:{title:'Mean rubric score vs. cost',x:{key:'cost',label:'Mean task cost',unit:'$',better:'lower'},y:{key:'score',label:'Mean rubric score',unit:'%',better:'higher'}},
 async fetch() {
  const table = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text.includes('Mean score')));
  if (!table) throw new Error('Missing board');
  return table.slice(1).map(r => {
    const model = text(r[1].html.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? '');
    const meta = text(r[1].html.match(/class="ddb-model__meta">([\s\S]*?)<\/span>/)?.[1] ?? '');
    const [harness, effort] = meta.split(/\s*·\s*/);
    const score = num(r[2].text), margin = num(r[2].text.split('±')[1] ?? '');
    if (!model || !harness || !effort || score === undefined) throw new Error('Unexpected model configuration');
    const cost = num(r[4].text), pass = r[3].text.match(/(\d+)\s*\/\s*(\d+)/);
    const minutes = num(r[7].text);
    const metrics: Record<string,number> = {};
    const values = {cost, steps: num(r[5].text), toolCalls: num(r[6].text), latency: minutes === undefined ? undefined : minutes * 60,
      passAt1: pass ? 100 * Number(pass[1]) / Number(pass[2]) : num(r[3].text),
      fullPassCount: pass ? Number(pass[1]) : undefined, tasks: pass ? Number(pass[2]) : undefined,
      passAt1Margin: num(r[3].text.split('±')[1] ?? '')};
    for (const [key, value] of Object.entries(values)) if (value !== undefined) metrics[key] = value;
    return {model, harness, setting: `V0.2; ${effort}; 81 tasks`, score, cost, metrics,
      low: margin === undefined ? undefined : score-margin, high: margin === undefined ? undefined : score+margin};
  });
 },
};
export default board;
