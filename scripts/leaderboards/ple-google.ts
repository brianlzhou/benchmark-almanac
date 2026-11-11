// Physical-Engineering's Last Exam (PLE), Google Cloud AI Research. ple-bench.com/leaderboard is a
// server-rendered matrix of model by agent harness on the 56 hidden test tasks (three runs per pair):
// each cell carries data-model, data-harness and data-score (the rubric score, 0 to 1, the board's unit)
// with the cost per task and runtime. Discipline scores are secondary metrics on each overall test row. The "Harness average" row has no data-model and is skipped. Every pair is
// kept with its harness; a cell marked "native harness" is the model maker's own agent. Costs marked
// "≈" are the page's estimates. The cell's runtime ("68 min", per task) is metrics.latency in seconds; a
// "<1 min" runtime is not exact and is not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://ple-bench.com/leaderboard';

const board: Leaderboard = {
  benchmark: 'ple-google',
  url: PAGE,
  feed: `${PAGE} (server-rendered matrix, overall test-set view)`,
  terms: 'Server-rendered page under the Google Terms of Service, which bar only automated access against robots.txt (it disallows just /api/); the dataset is CC BY 4.0 and the code Apache-2.0.',
  chart: { title: 'Score versus cost per task', x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Score', better: 'higher' } },
  aliases: {
    'GPT 6 Astra': 'gpt-6-astra',
    'Gemma 4 26B': 'gemma-4-26b-a4b',
    'Qwen3 Coder 480B': 'qwen3-coder-480b-a35b',
    'Qwen3-Next 80B': 'qwen3-next-80b-a3b',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const bodies=[...html.matchAll(/<tbody data-set="([^"]+)" data-domain="([^"]*)"[^>]*>[\s\S]*?<\/tbody>/g)];
    if(!bodies.length)throw new Error("No PLE result tables");
    const rows: LeaderboardRow[] = [];
    for(const body of bodies.filter(b => b[1] === "test" && !b[2])){
    for (const m of body[0].matchAll(/<td\b[^>]*data-harness="([^"]+)"[^>]*data-model="([^"]+)"[^>]*data-score="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g)) {
      const [, harness, model, score, cell] = m;
      const cost = cell.match(/class="v v-cost">([\s\S]*?)<\/span>\s*<span class="v v-time"/)?.[1];
      const minutes = cell.match(/class="v v-time">\s*([\d.]+)\s*min\s*</)?.[1];
      rows.push({
        model,
        harness,
        setting:body[2]?body[1]+"; "+body[2]:undefined,
        score: Number(score),
        cost: num(cost?.replace(/<[^>]+>/g, '').replace(/[^\d.]/g, ' ')),
        metrics: minutes ? { latency: Number(minutes) * 60 } : undefined,
      });
    }
    }
    for (const body of bodies.filter(b => b[1] === 'test' && b[2])) {
      for (const m of body[0].matchAll(/<td\b[^>]*data-harness="([^"]+)"[^>]*data-model="([^"]+)"[^>]*data-score="([^"]+)"/g)) {
        const row = rows.find(r => r.harness === m[1] && r.model === m[2]);
        if (row && Number.isFinite(Number(m[3]))) (row.metrics ??= {})[body[2]] = Number(m[3]);
      }
    }
    for (const row of rows) if (row.cost !== undefined) (row.metrics ??= {}).cost = row.cost;
    if (!rows.length) throw new Error('No PLE overall test scores');
    return rows;
  },
};
export default board;
