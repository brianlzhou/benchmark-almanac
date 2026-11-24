// Mind2Act World tests simulated manipulation. The board defines the overall score as
// "25% Mind + 25% Act + 50% Mind2Act" and averages Clean and Random for its Mean view.
// The embedded leaderboard data also gives the unweighted percentage of successful runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://mind2act-world.com/leaderboard.html';
const views = { mind: 'Mind', act: 'Act', coupling: 'Mind2Act', overall: 'Overall' };
type Cell = { score: number, success: number, valid: number };
type Entry = { name: string, track: string, results: null | Record<'clean' | 'random', Record<string,Cell>> };
const board: Leaderboard = {
  benchmark: 'mind2act-world', url: feed, feed,
  terms: 'The Mind2Act World team publishes these results at https://mind2act-world.com/leaderboard.html.',
  aliases: { 'π0.5': 'pi0-5' },
  parts: {}, stats: {
    costCny: { name: 'Approximate cost per task', unit: 'cny', better: 'lower' },
    minutes: { name: 'Time per task', unit: 'minutes', better: 'lower' },
    callSeconds: { name: 'Time per call', unit: 'seconds', better: 'lower' },
    predictionMs: { name: 'Time per prediction', unit: 'ms', better: 'lower' },
    success: { name: 'Overall success rate', unit: '%', better: 'higher' } },
  headline: 'The board averages Clean and Random task scores on a 0 to 100 scale, with partial credit.',
  async fetch() {
    const html = await fetchText(feed);
    const data = html.match(/<script[^>]+id="leaderboardExplorerData"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!data) throw new Error('Missing leaderboard explorer data');
    const { schema_version, models } = JSON.parse(data) as {schema_version: number, models: Entry[]};
    if (schema_version !== 2 || !Array.isArray(models)) throw new Error('Unexpected leaderboard schema');
    const efficiency = new Map<string, {link: string, metrics: Record<string,number>}>();
    for (const [row] of html.matchAll(/<tr class="ef-model-row">[\s\S]*?<\/tr>/g)) {
      const link = row.match(/class="ef-model" href="([^"]+)"/)?.[1];
      const name = row.match(/<span>([^<]+)<\/span>/)?.[1];
      if (!link || !name) throw new Error('Missing efficiency row identity');
      const metrics: Record<string,number> = {};
      for (const [,value] of row.matchAll(/class="ef-value">([\s\S]*?)<\/span>/g)) {
        const cell = text(value);
        const match = cell.match(/^(?:≈\s*)?(¥)?([\d.]+)\s*(min|ms|s)?$/);
        if (!match) continue;
        const key = match[1] ? 'costCny' : ({min:'minutes',ms:'predictionMs',s:'callSeconds'} as Record<string,string>)[match[3]];
        if (key) metrics[key] = Number(match[2]);
      }
      efficiency.set(name,{link: new URL(link,feed).href, metrics});
    }
    const rows: LeaderboardRow[] = [];
    for (const { name, track, results } of models) {
      if (results === null) continue;
      const metrics: Record<string,number> = {};
      for (const [key, label] of Object.entries(views)) {
        for (const scene of ['clean', 'random'] as const) {
          const cell = results[scene][key];
          if (![cell.score,cell.success,cell.valid].every(Number.isFinite)) throw new Error('Missing scene result');
          for (const measure of ['score','success'] as const) {
            const id = scene + '_' + key + '_' + measure;
            metrics[id] = cell[measure];
            board.parts![id] = { name: label + (measure === 'score' ? ' score' : ' success rate'), group: scene === 'clean' ? 'Clean' : 'Random', unit: measure === 'score' ? 'score' : '%' };
          }
        }
      }
      const a = results.clean.overall, b = results.random.overall;
      metrics.success = (a.success + b.success)/2;
      const info = efficiency.get(name);
      Object.assign(metrics, info?.metrics);
      rows.push({ model: name, link: info?.link, setting: track === 'agent' ? 'Agent' : 'End-to-end', score: (a.score+b.score)/2, trials: a.valid+b.valid, metrics });
    }
    return checked(rows, 11);
  },
};
export default board;
