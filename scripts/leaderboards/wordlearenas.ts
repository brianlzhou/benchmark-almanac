// WordleArenas reports average win rate across the arenas each configuration played. Reproduce the results page’s unweighted Avg column from its batch summary.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://drchangliu.github.io/WordleArenas/batch_results/summary.json";
const board: Leaderboard = {
  benchmark: "wordlearenas",
  url: "https://drchangliu.github.io/WordleArenas/experiment_results.html",
  feed: FEED,
  terms: "The maker lists no score reuse license on this page. https://drchangliu.github.io/WordleArenas/experiment_results.html The robots file allows this feed for the importer.",
  aliases: {
  "Claude Sonnet 4 6": "claude-sonnet-4-6",
  "Deepseek Reasoner": "deepseek-r1",
  "Deepseek V4 Flash": "deepseek-v4-flash",
  "Deepseek V4 Pro": "deepseek-v4-pro",
  "Gemini 3 Flash Preview": "gemini-3-flash",
  "Gemini 3.1 Pro Preview": "gemini-3-1-pro",
  "GPT-4o Mini": "gpt-4o-mini",
  "Gpt 5": "gpt-5",
  "Gpt 5 Mini": "gpt-5-mini",
  "Gpt 5.1": "gpt-5-1",
  "O3": "o3",
  "O4 Mini": "o4-mini",
  "Qwen3.5 27b": "qwen3-5-27b",
  "Qwen3 14b": "qwen3-14b",
  "Qwen3 32b": "qwen3-32b",
  "Qwen3 8b": "qwen3-8b",
  "Smollm2 1.7b": "smollm2-1-7b",
  "Smollm2 135m": "smollm2-135m"
},
  parts: { wordle: 'Wordle', fibble: 'Fibble', fibble2: 'Fibble²', fibble3: 'Fibble³', fibble4: 'Fibble⁴', fibble5: 'Fibble⁵' },
  stats: {
    ...Object.fromEntries(['wordle','fibble','fibble2','fibble3','fibble4','fibble5'].flatMap(key => [[`${key}Games`, { name: `${key} games played`, unit: 'count' }], [`${key}Wins`, { name: `${key} wins`, unit: 'count' }], [`${key}Attempts`, { name: `${key} average attempts`, unit: 'count', better: 'lower' }], [`${key}Latency`, { name: `${key} latency`, unit: 'seconds', better: 'lower' }]])),
    latency: { name: 'Average latency', unit: 'seconds', better: 'lower' },
  },
  async fetch() {
    type Run = { model_display: string; flags: string[]; games_played: number; wins: number; win_rate: number; avg_latency_ms: number; avg_attempts: number | null; timestamp: string };
    const { arenas } = await fetchJson<{ arenas: Record<string, Record<string,Run>> }>(FEED);
    const games = ['wordle','fibble','fibble2','fibble3','fibble4','fibble5'];
    const ids = new Set(games.flatMap(g => Object.keys(arenas[g])));
    if (ids.size < 52) throw new Error('Missing WordleArenas configurations');
    return [...ids].map(id => {
      const metrics: Record<string, number> = {};
      let trials = 0, sum = 0, count = 0, time = 0, timed = 0;
      let entry: Run | undefined;
      for (const g of games) {
        const r = arenas[g][id];
        if (!r) continue;
        if (!r.model_display || !Number.isFinite(r.win_rate) || !(r.games_played > 0)) throw new Error('Invalid arena result for ' + id);
        entry ??= r; count++; sum += r.win_rate; trials += r.games_played;
        metrics[g] = r.win_rate; metrics[g+'Games'] = r.games_played; metrics[g+'Wins'] = r.wins;
        if (r.avg_attempts != null) metrics[g+'Attempts'] = r.avg_attempts;
        if (r.avg_latency_ms > 0) { metrics[g+'Latency'] = r.avg_latency_ms / 1000; time += r.avg_latency_ms / 1000; timed++; }
      }
      if (timed) metrics.latency = time / timed;
      return { model: entry!.model_display, setting: entry!.flags.join(', ') || undefined, trials, score: Number((sum/count).toFixed(1)), metrics };
    });
  },
};
export default board;
