// Omni-InteractScope tests whether models respond correctly and at the right time.
// The board says its explicit-request average equally weights T1 to T4, T6 and T7.
// Its public results file also reports a separate T5 diagnostic and assistance-task recall.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const feed = 'https://raw.githubusercontent.com/YinsongYan/Omni-InteractScope/HEAD/docs/public_results.json';
const explicit = ['T1', 'T2', 'T3', 'T4', 'T6', 'T7'];
interface Result {
  split: string; model: string; input: string; macro_pct: number; terminal_failures: number;
  overall: { percentage: number }; by_task: Record<string,{ percentage: number }>; complete_c: { hits: number; total: number };
}
const board: Leaderboard = {
  benchmark: 'omni-interactscope', feed, url: 'https://github.com/YinsongYan/Omni-InteractScope/blob/main/LEADERBOARD.md',
  terms: 'The authors publish their reference scores on GitHub. https://github.com/YinsongYan/Omni-InteractScope#code-license',
  headline: 'The leaderboard ranks explicit requests by the equally weighted accuracy of T1 to T4, T6 and T7. It reports assistance recall separately.',
  aliases: { 'qwen3-vl-8b': 'qwen3-vl-8b-instruct', 'minicpm-o': 'minicpm-o-4-5', 'livecc-7b': 'livecc-7b-instruct' },
  stats: { completeT8CHits: { name: 'Complete T8-C hits', unit: 'count', better: 'higher' }, explicitTerminalFailures: { name: 'Explicit terminal failures', unit: 'count', better: 'lower' }, assistanceTerminalFailures: { name: 'Assistance terminal failures', unit: 'count', better: 'lower' } },
  parts: { ...Object.fromEntries([...explicit,'T5','T8A','T8B','T8C'].map(key => [key,key.replace(/^T8(.)$/, 'T8-$1')])),
    t8Overall: 'T8 overall', explicitMicro: 'Explicit-request accuracy across targets' },
  async fetch() {
    const doc = await fetchJson<{results: Result[]; separate_t5: {results: { model:string; percentage:number }[]}}>(feed);
    const rows: LeaderboardRow[] = [];
    for (const r of doc.results.filter(r => r.split === 'table2')) {
      const t8 = doc.results.find(t => t.split === 'table3' && t.model === r.model && t.input === r.input);
      if (!t8) throw Error('Missing assistance results for ' + r.model);
      const metrics: Record<string,number> = { explicitMicro: r.overall.percentage, t8Overall: t8.overall.percentage,
        completeT8CHits: t8.complete_c.hits,
        explicitTerminalFailures: r.terminal_failures, assistanceTerminalFailures: t8.terminal_failures };
      for (const task of explicit) metrics[task] = r.by_task[task].percentage;
      for (const task of ['A','B','C']) metrics['T8' + task] = t8.by_task[task].percentage;
      const diagnostic = doc.separate_t5.results.find(t => t.model === r.model);
      if (diagnostic) metrics.T5 = diagnostic.percentage;
      if (!Object.values(metrics).every(Number.isFinite)) throw Error('Missing published task result');
      rows.push({ model: r.model, setting: 'Input: ' + r.input.toUpperCase(), score: r.macro_pct, metrics });
    }
    return checked(rows, 12);
  },
};
export default board;
