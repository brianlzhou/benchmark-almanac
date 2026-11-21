// ReSpaceBench tests spatial memory across repeated visits to homes.
// Table 2 reports overall accuracy as the unweighted mean of nine task accuracies.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2611.21485';
const parts = {
  t1: 'Query-to-memory association', t2: 'Same-instance identification', t3: 'Revisit counting',
  association: 'Association', t4: 'Room inventory', t5: 'Object-place binding', t6: 'Unique-object counting',
  t7: 'Cross-session state', persistentState: 'Persistent state', t8: 'Spatial topology',
  t9: 'Temporal successor', reasoning: 'Reasoning',
};
const board: Leaderboard = {
  benchmark: 'respacebench', url: 'https://arxiv.org/abs/2611.21485', feed, static: 'paper', parts, stats: { rank: { name: 'Leaderboard rank', unit: 'count', better: 'lower' } },
  terms: 'The paper license is linked at https://arxiv.org/abs/2611.21485.',
  aliases: {'Qwen3-VL-8B':'qwen3-vl-8b-instruct','GLM-4.6V-106B':'glm-4-6v','GLM-4.6V-Flash-9B':'glm-4-6v-flash'},
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 2 Evaluation of 32 models on ReSpaceBench.')[1]?.split(/\n\s*\n\s*\n\s*\d+\s*\f/)[0];
    if (!table || !/Methods\s+Rank Avg\./.test(table) || !/T7\s+Avg\.\s+T8\s+T9\s+Avg\./.test(table)) {
      throw new Error('Missing ReSpaceBench results columns');
    }
    const rows: LeaderboardRow[] = [];
    let section = '';
    for (const line of table.split('\n')) {
      const cells = line.trim().split(/\s+/);
      if (!/^\d+\.\d+$/.test(cells.at(-1) ?? '')) {
        section = line.trim();
        continue;
      }
      if (section === 'ReSpaceBench-mini') continue;
      const values = cells.splice(-13).map(Number);
      if (!values.every(Number.isFinite)) throw new Error('Invalid ReSpaceBench scores');
      const rank = cells.pop();
      const label = cells.join(' ').replace(/\s*\[\d+\]/g, '');
      if (section === 'Ours' && label === 'Qwen3-VL-8B') continue;
      const blind = label.includes('Blind');
      const model = label.replace(/^Blind \((.+)\)$/, '$1').replace(/ \((Blind|Ours)\)†?$/, '');
      rows.push({model, score: values[0], setting: blind ? 'Blind' : 'Video',
        metrics: {...Object.fromEntries(Object.keys(parts).map((key, i) => [key, values[i + 1]])),
          ...(rank && /^\d+$/.test(rank) ? {rank: Number(rank)} : {}) }});
    }
    return checked(rows, 35);
  },
};
export default board;
