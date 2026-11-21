// PRISM tests whether reordering fixed reasoning instructions changes math accuracy.
// The author's Q4 reports use the same 100 random orderings and 32 GSM8K questions for all three models.
// The registered evaluation reads worst-ordering accuracy first. Q4 prints the ends of the range to two decimal places.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const base = 'https://raw.githubusercontent.com/bleymambwe/PRISM/main/experiments/iteration-19-crossfamily/results/';
const board: Leaderboard = {
  benchmark: 'prism-instruction-order-sensitivity', url: 'https://github.com/bleymambwe/PRISM/tree/main/experiments/iteration-19-crossfamily',
  feed: base + '{llama,qwen}_transfer_report.txt', costPer: 'run',
  terms: 'The authors license the experiment results under CC BY 4.0 at https://github.com/bleymambwe/PRISM/blob/main/LICENSE-ARTIFACTS.',
  aliases: { 'qwen/qwen3-30b-a3b-instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025' },
  async fetch() {
    const rows = new Map<string, LeaderboardRow>();
    for (const leg of ['llama', 'qwen']) {
      if (leg === 'qwen') await new Promise(resolve => setTimeout(resolve, 1000));
      const report = await fetchText(base + leg + '_transfer_report.txt');
      const target = report.match(/^MODEL: (\S+) /)?.[1];
      const section = report.split('Q4 order sensitivity (same 32 questions):')[1]?.split('Q5 warm-start')[0];
      const spend = report.match(/spend: (\d+) calls; API-reported \$(\d+\.\d+)/);
      if (!target || !section || !spend) throw new Error('Incomplete PRISM transfer report');
      const matches = [...section.matchAll(/^\s*([\w-]+) \((source|target)\): mean ([\d.]+), std ([\d.]+), range \[([\d.]+), ([\d.]+)\]/gm)];
      if (matches.length !== 2) throw new Error('Missing Q4 model');
      for (const [, label, role, mean, sd, worst, best] of matches) {
        const model = role === 'target' ? target : label === 'flash-lite' ? 'Gemini 2.5 Flash-Lite' : label;
        const score = Number(worst) * 100;
        if (rows.has(model) && rows.get(model)!.score !== score) throw new Error('Conflicting source score');
        rows.set(model, { model, score, setting: 'GSM8K, 100 random orderings', metrics: {
          bestOrderingAccuracy: Number(best) * 100, orderingMean: Number(mean) * 100, orderingStd: Number(sd) * 100,
          orderingCount: 100, questions: 32, ...(role === 'target' ? { experimentApiCalls: +spend[1] } : {}),
        }, ...(role === 'target' ? { cost: +spend[2] } : {}) });
      }
    }
    return checked([...rows.values()], 3);
  },
};
export default board;
