// MedHEB measures whether embeddings retrieve related clinical evidence. Table 4 reports task-macro Hit@1 and MRR@5.
// The headline is Hit@1 across all 107 tasks. Table 8 supplies Hit@5 for the same models.
import type { BoardStat, Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.02519';
const labels = ['I-I','MB-VR','I-Lab','I-Rep','T-I','VQA','VG','T-T','ID','Held-out- source','All'];
const medhebStats: Record<string, BoardStat> = Object.fromEntries(labels.flatMap(label => {
  const name = label === 'MB-VR' ? 'Modality-bridging visual retrieval' : label === 'VG' ? 'Visual grounding' : label.replace('- ', '-');
  return [[label.replaceAll(' ','') + 'MRR5', {name: name + ' MRR@5', unit:'%', better:'higher' as const}], [label.replaceAll(' ','') + 'Hit5', {name: name + ' Hit@5', unit:'%', better:'higher'}]];
}));
const board: Leaderboard = {
  benchmark: 'medheb', static: 'paper', url: feed, feed,
  stats: medhebStats,
  terms: 'The authors publish the paper under the terms at https://arxiv.org/abs/2611.02519.',
  aliases: { 'Qwen3-VL-Embed-2B': 'qwen3-vl-embedding-2b', 'Qwen3-VL-Embed-8B': 'qwen3-vl-embedding-8b' },
  parts: Object.fromEntries(labels.slice(0,-1).map((k,i) => [k.replaceAll(' ',''), { name: k.replace('- ', '-'), group: i < 8 ? 'Retrieval family' : 'Split' }])),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid).filter(t => t[1]?.join('|') === ['',...labels].join('|'));
    const main = tables.find(t => t[3]?.[1]?.includes('('));
    const top5 = tables.find(t => t[3]?.[0] === 'Baseline Models');
    if (!main || !top5 || main[2].at(-1) !== '107') throw new Error('Missing MedHEB results');
    return checked(main.slice(3).map(([model, ...cells]) => {
      const other = top5.find(r => r[0].replace('BLIP2','BLIP-2') === model);
      if (!other || cells.length !== labels.length) throw new Error('Incomplete MedHEB row');
      const metrics: Record<string,number> = {};
      labels.forEach((label,i) => {
        const pair = cells[i].match(/^([\d.]+) \(([\d.]+)\)$/);
        if (!pair) throw new Error('Missing Hit@1 or MRR@5');
        const key = label.replaceAll(' ','');
        metrics[key] = numberCell(pair[1]);
        metrics[key+'MRR5'] = numberCell(pair[2]);
        metrics[key+'Hit5'] = numberCell(other[i+1]);
      });
      const { All: score, ...rest } = metrics;
      return { model, score, metrics: rest };
    }), 10);
  },
};
export default board;
