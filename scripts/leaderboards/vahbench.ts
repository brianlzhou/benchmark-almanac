// VAHBench evaluates production of five video series from briefs. Table 2 ranks each model and harness by mean S across the five briefs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.20535';
const models: Record<string,string> = { 'DS-F': 'deepseek-v4-flash', 'DS-V': 'deepseek-v4-vis', GLM: 'glm-5.2', GPT: 'gpt-5.6', Opus: 'claude-opus-5' };
const board: Leaderboard = {
  benchmark: 'vahbench', static: 'paper', url: feed, feed, harnesses: 'system',
  terms: 'The authors publish Table 2 under the terms linked at https://arxiv.org/abs/2611.20535.',
  stats: { completeness: { name: 'Mean completeness', unit: 'score', better: 'higher' }, quality: { name: 'Mean quality', unit: 'score', better: 'higher' } },
  parts: { B1: 'The Woman Behind the Numbers', B2: 'Terms of the Borrowed Vow', B3: 'The Algorithm Knows My Name', B4: 'The Nineteenth Floor', B5: 'The Last Clause' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => t[0]?.join('|') === 'Model|B1|B2|B3|B4|B5|\\bar{C}|\\bar{Q}|\\bar{S}');
    if (tables.length !== 2) throw new Error('Missing VAHBench Table 2 panels');
    const rows: LeaderboardRow[] = [];
    for (const t of tables) {
      let harness = '';
      for (const r of t.slice(1)) {
        if (['General-purpose','OpenMontage','Purpose-built','Agent mean','Track mean'].includes(r[0])) continue;
        if (r.every(c => c === r[0])) { harness = r[0]; continue; }
        if (!models[r[0]] || !harness) throw new Error('Unknown VAHBench configuration ' + r[0]);
        const metrics: Record<string,number> = { completeness: numberCell(r[6]), quality: numberCell(r[7]) };
        for (let i=1; i<=5; i++) metrics['B'+i] = numberCell(r[i]);
        rows.push({ model: models[r[0]], harness, score: numberCell(r[8]), metrics });
      }
    }
    return checked(rows,48);
  },
};
export default board;
