// Physical-Engineering's Last Exam (PLE), Google Cloud AI Research. ple-bench.com/leaderboard is a
// server-rendered matrix of model by agent harness on the 56 hidden test tasks (three runs per pair):
// each cell carries data-model, data-harness and data-score (the rubric score, 0 to 1, the board's unit)
// with the cost per task and runtime. Only the first tbody, the overall view, is read; the others split
// the same runs by discipline. The "Harness average" row has no data-model and is skipped. Every pair is
// kept with its harness; a cell marked "native harness" is the model maker's own agent. Costs marked
// "≈" are the page's estimates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://ple-bench.com/leaderboard';

const board: Leaderboard = {
  benchmark: 'ple-google',
  url: PAGE,
  feed: `${PAGE} (server-rendered matrix, overall test-set view)`,
  terms: 'Server-rendered page under the Google Terms of Service, which bar only automated access against robots.txt (it disallows just /api/); the dataset is CC BY 4.0 and the code Apache-2.0.',
  aliases: {
    'GPT 6 Astra': 'gpt-6-astra',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const body = html.match(/<tbody data-set="test" data-domain=""[\s\S]*?<\/tbody>/)?.[0];
    if (!body) throw new Error('no overall test-set table on the PLE leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const m of body.matchAll(/<td\b[^>]*data-harness="([^"]+)"[^>]*data-model="([^"]+)"[^>]*data-score="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g)) {
      const [, harness, model, score, cell] = m;
      const cost = cell.match(/class="v v-cost">([\s\S]*?)<\/span>\s*<span class="v v-time"/)?.[1];
      rows.push({ model, harness, score: Number(score), cost: num(cost?.replace(/<[^>]+>/g, '').replace(/[^\d.]/g, ' ')) });
    }
    return rows;
  },
};
export default board;
