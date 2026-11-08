// Nexus Function Calling Leaderboard (Nexusflow). The Hugging Face Space is paused, but its app.py is public
// (Apache-2.0) and hard-codes the board: RESULTS maps each of nine tasks to per-model accuracy (0 to 1). The
// board's first table, "All Tasks", is the plain mean over the nine tasks (pandas mean), with the last model
// (Gorilla open-function-v1, which lacks one task) left out; this file computes the same mean. The results
// The page defines `all_tasks_avg = pd.DataFrame(results).mean(axis=1)`.
// Task scores are secondary metrics on complete overall rows. Results
// date from the NexusRaven-V2 release (December 2023). "GPT3.5" names no snapshot, so it is left unmatched.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SPACE = 'https://huggingface.co/spaces/Nexusflow/Nexus_Function_Calling_Leaderboard';
const FEED = `${SPACE}/raw/main/app.py`;

const board: Leaderboard = {
  benchmark: 'nexus',
  url: SPACE,
  feed: `${FEED} (RESULTS, mean over the nine tasks)`,
  terms: 'Public Hugging Face Space, Apache-2.0 (README front matter); huggingface.co robots.txt allows Space files.',
  aliases: {
    'GPT4-1106': 'gpt-4-turbo-nov-2023',
  },
  async fetch() {
    const src = await fetchText(FEED);
    const block = src.match(/RESULTS\s*=\s*\{([\s\S]*?)\n\}/)?.[1];
    if (!block) throw new Error('RESULTS not found in app.py');
    const tasks = [...block.matchAll(/'([\w-]+)':\s*\{([^}]*)\}/g)];
    if (tasks.length !== 9) throw new Error(`expected 9 tasks, found ${tasks.length}`);
    const order: string[] = [];
    const per = new Map<string, number[]>();
    for (const [, , inner] of tasks) {
      for (const m of inner.matchAll(/"([^"]+)":\s*([\d.]+)/g)) {
        if (!per.has(m[1])) {
          order.push(m[1]);
          per.set(m[1], []);
        }
        per.get(m[1])!.push(Number(m[2]));
      }
    }
    // the app drops the last model of the table (all_tasks_avg[:-1])
    const rows: LeaderboardRow[] = [];
    for (const model of order.slice(0, -1)) {
      const v = per.get(model)!;
      rows.push({ model, score: Number(((v.reduce((a, b) => a + b, 0) / v.length) * 100).toFixed(2)) });
    }
    // Preserve task scores only on the published complete-model overall rows.
    for (const [, task, inner] of tasks) {
      for (const m of inner.matchAll(/"([^"]+)":\s*([\d.]+)/g)) {
        const row = rows.find(r => r.model === m[1]);
        if (row) (row.metrics ??= {})[task.toLowerCase()] = Number(m[2]) * 100;
      }
    }
    return rows;
  },
};
export default board;
