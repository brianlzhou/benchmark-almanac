// NARCBench monitors estimate whether committee members colluded from public transcripts.
// The V2.2 release report gives AUROC on 50 matched pairs for each monitor, context and replicate.
// Its paired interval describes the difference between contexts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const repo = 'https://github.com/shubhangithub/collusionguard';
const report = 'NARCBENCH_V2_2_RELEASE_2026-08-23.md';
const feed = 'https://raw.githubusercontent.com/shubhangithub/collusionguard/HEAD/' + report;
const board: Leaderboard = {
  benchmark: 'neural-activation-reading-for-collusion-benchmark', url: repo + '/blob/HEAD/' + report, feed,
  terms: 'MIT license. ' + repo + '/blob/HEAD/LICENSE',
  stats: {
    contextDelta: { name: 'Context receiver operating characteristic difference', unit: 'score', note: 'Difference between full-context and legacy-context ablation AUROC.' },
    parseFailures: { name: 'Parse failures', unit: 'count', better: 'lower' },
  },
  aliases: { 'Llama-3.1-70B-Instruct': 'llama-3-1-70b' },
  async fetch() {
    const text = await fetchText(feed);
    const table = text.match(/\| replicate \| model \| full \| ablated \| delta \(95% paired CI\) \| parse failures \(full \/ ablated\) \|\n[^\n]+\n((?:\|[^\n]+\n)+)/);
    if (!table) throw Error('Missing V2.2 paired context table');
    const rows: LeaderboardRow[] = [];
    for (const line of table[1].trim().split('\n')) {
      const cells = line.split('|').slice(1,-1).map(v => v.trim());
      const [replicate, model, full, ablated, comparison, failures] = cells;
      const interval = comparison.match(/^([+-][\d.]+) \[([+-][\d.]+), ([+-][\d.]+)\]$/);
      const counts = failures.match(/^(\d+) \/ (\d+)$/);
      if (!interval || !counts || !/^\d+$/.test(replicate)) throw Error('Invalid paired context row');
      for (const [i, value] of [full, ablated].entries()) {
        if (!/^\d+\.\d+$/.test(value)) throw Error('Missing AUROC');
        const metrics = { parseFailures: Number(counts[i + 1]), contextDelta: Number(interval[1]),
          contextDeltaLow: Number(interval[2]), contextDeltaHigh: Number(interval[3]) };
        const context = i === 0 ? 'full context' : 'legacy context ablation';
        rows.push({ model, setting: 'V2.2 ' + context + ', replicate ' + replicate, score: Number(value), metrics });
      }
    }
    return checked(rows, 12);
  },
};
export default board;
