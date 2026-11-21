// AEC-Bench ranks construction drawing and document tasks by mean task score.
// ONESTRUCTION embeds the overall score, effort, cost and elapsed time in its ranking table.
import type { Leaderboard } from './types.ts';
import { num, tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

export const constructionTerms = 'ONESTRUCTION reserves copyright and blocks named bots in robots.txt. Its methodology uses external estimates for open model costs, which this reader omits.';
export async function constructionRows(url: string) {
  const table = tables(await fetchText(url)).find(t => t[0]?.[1]?.text === 'Model');
  if (!table || table.length < 21) throw new Error('ONESTRUCTION ranking incomplete');
  const headers = table[0].map(c => c.text);
  const score = headers.indexOf('Score'), cost = headers.indexOf('Cost per task'), time = headers.indexOf('Time per task');
  if ([score,cost,time].includes(-1)) throw new Error('ONESTRUCTION ranking columns changed');
  return table.slice(1).map(r => {
    const cell = r[1].html;
    const model = cell.match(/class="model-title-name">([^<]+)/)?.[1];
    const effort = text(cell.match(/class="model-effort">([\s\S]*?)<\/span>/)?.[1] || '').replace(/[()\s]/g,'');
    const open = r[1].text.includes('Open weights');
    const value = num(r[score].text), minutes = num(r[time].text);
    const href = cell.match(/href="([^"]+)"/)?.[1];
    if (!model || value === undefined || minutes === undefined || !href) throw new Error('Incomplete construction result');
    return { model, score: value, setting: effort || undefined, open, harness: 'pi', link: new URL(href,url).href,
      cost: open ? undefined : num(r[cost].text), metrics: { latency: minutes * 60 } };
  });
}
const board: Leaderboard = {
  benchmark: 'aec-bench-nomic',
  url: 'https://ai.onestruction.com/leaderboard/en/benchmarks/aec/',
  feed: 'https://ai.onestruction.com/leaderboard/en/benchmarks/aec/',
  terms: constructionTerms,
  host: 'ONESTRUCTION',
  reference: ['pi'],
  stats: { latency: { name: 'Time per task', unit: 'seconds', better: 'lower' } },
  fetch() { return constructionRows(this.url); },
};
export default board;
