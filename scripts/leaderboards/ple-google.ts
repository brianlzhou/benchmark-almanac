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
  parts: {
    civil: { name: 'Civil engineering', group: 'Domain' },
    structural: { name: 'Structural', group: 'Domain' },
    electrical: { name: 'Electrical', group: 'Domain' },
    mechanical: { name: 'Mechanical', group: 'Domain' },
  },
  url: PAGE,
  feed: `${PAGE} (server-rendered matrix, overall test-set view)`,
  terms: 'Server-rendered page under the Google Terms of Service, which bar only automated access against robots.txt (it disallows just /api/); the dataset is CC BY 4.0 and the code Apache-2.0.',
  stats: { latency: { name: 'Latency', unit: 'minutes', better: 'lower' } },
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
        trials: 3,
        setting: cell.includes('native harness:') ? 'native harness' : undefined,
        score: Number(score),
        cost: num(cost?.replace(/<[^>]+>/g, '').replace(/[^\d.]/g, ' ')),
        metrics: {
          ...(minutes ? { latency: Number(minutes) * 60 } : {}),
          ...(cell.match(/title="± ([\d.]+) across runs"/) ? { runSpread: Number(cell.match(/title="± ([\d.]+) across runs"/)![1]) } : {}),
          ...(cost?.includes('≈') ? { estimatedCost: 1 } : {}),
        },
      });
    }
    }
    for (const body of bodies.filter(b => b[1] === 'test' && b[2])) {
      for (const m of body[0].matchAll(/<td\b[^>]*data-harness="([^"]+)"[^>]*data-model="([^"]+)"[^>]*data-score="([^"]+)"[^>]*>([\s\S]*?)<\/td>/g)) {
        const row = rows.find(r => r.harness === m[1] && r.model === m[2]);
        if (!row || !Number.isFinite(Number(m[3]))) continue;
        const metrics = row.metrics ??= {};
        metrics[body[2]] = Number(m[3]);
        const spread = m[4].match(/title="± ([\d.]+) across runs"/);
        if (spread) metrics[body[2] + ':runSpread'] = Number(spread[1]);
      }
    }
    for (const row of rows) if (row.cost !== undefined) (row.metrics ??= {}).cost = row.cost;
    if (!rows.length) throw new Error('No PLE overall test scores');
    return rows;
  },
};
export default board;
