// DrivingBench v1 measures progress along the original Toyota cone course.
// The official page ranks models by their best progress in up to three attempts in the same chat.
// Read the structured results embedded in the v1 page, including usage totals for all attempts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://drivingbench.com/v1/';
interface Attempt {
  n: number; progress: number; duration_s: number; commands: number; cost_usd: number;
  tokens: { total: number; input: number; output: number };
}
interface Entry { name: string; harness: string; reasoning: string; best_progress: number; attempts: Attempt[] }
const board: Leaderboard = {
  benchmark: 'drivingbench', url: feed, feed, costPer: 'run', harnesses: 'model',
  terms: 'DrivingBench publishes the results as research software with no stated data license. ' + feed,
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const match of html.matchAll(/self\.__next_f\.push\((\[.*?\])\)<\/script>/gs)) {
      const payload = JSON.parse(match[1])[1];
      if (typeof payload !== 'string' || !payload.includes('"best_progress"')) continue;
      for (const line of payload.split('\n').filter(line => line.includes('"best_progress"'))) {
        JSON.parse(line.slice(line.indexOf(':') + 1), (key, value) => {
          if (key !== 'models' || !Array.isArray(value) || !('best_progress' in (value[0] ?? {}))) return value;
          for (const entry of value as Entry[]) {
            const attempts = entry.attempts;
            if (!Array.isArray(attempts) || !attempts.length || attempts.length > 3 || !entry.harness || !entry.reasoning) throw Error('Invalid driving result');
            let cost = 0, tokens = 0;
            const metrics: Record<string, number> = { inputTokens: 0, outputTokens: 0 };
            for (const a of attempts) {
              if (![a.n,a.progress,a.duration_s,a.commands,a.cost_usd,a.tokens?.total,a.tokens?.input,a.tokens?.output].every(Number.isFinite)) throw Error('Invalid attempt data');
              metrics['attempt' + a.n] = a.progress * 100;
              metrics['attempt' + a.n + 'Seconds'] = a.duration_s;
              metrics['attempt' + a.n + 'Commands'] = a.commands;
              metrics.inputTokens += a.tokens.input;
              metrics.outputTokens += a.tokens.output;
              tokens += a.tokens.total;
              cost += a.cost_usd;
            }
            if (entry.best_progress !== Math.max(...attempts.map(a => a.progress))) throw Error('Best progress disagrees with attempts');
            rows.push({ model: entry.name, harness: entry.harness, setting: entry.reasoning + ' reasoning, best of up to three attempts',
              score: entry.best_progress * 100, trials: attempts.length, metrics, cost, tokens });
          }
          return value;
        });
      }
    }
    return checked(rows, 4);
  },
};
export default board;
