// CADPrompt asks for CAD programs that reproduce 200 reference parts from text.
// Table 2 gives median point cloud distance and interquartile range. Lower distance is better.
// Table 8 breaks out GPT-4 few-shot results by shape complexity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2410.05340';
const parts: Record<string, string> = {};
function pair(s: string) {
  const m = /^([\d.]+) \(([\d.]+)\)$/.exec(s);
  if (!m) throw new Error('Expected median and IQR');
  return [Number(m[1]), Number(m[2])];
}
const board: Leaderboard = {
  benchmark: 'cadprompt', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish their evaluation in the paper. https://arxiv.org/abs/2410.05340',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0][1] === 'Feedback Mechanism' && t[0][3]?.startsWith('Point Cloud') && t.some(r=>r[0].startsWith('CodeLlama:')));
    const split = tables.find(t => t[0][0] === 'Complexity' && t[0][3]?.includes('PLC distances'));
    if (!t || !split) throw new Error('Missing full or complexity results table');
    const rows: LeaderboardRow[] = [];
    for (const [label, feedback, overlap, cloud, distance, compile] of t.slice(1)) {
      if (feedback.startsWith('Geometric solver')) continue;
      const [name, setting] = label.split(': ');
      const model = name === 'CodeLlama' ? 'CodeLlama 70B' : name;
      const [score, iqr] = pair(cloud);
      const [iogt, iogtIqr] = pair(overlap);
      const [hausdorff, hausdorffIqr] = pair(distance);
      if (!/^[\d.]+%$/.test(compile)) throw new Error('Missing compile rate');
      const metrics: Record<string, number> = { iqr, iogt, iogtIqr, hausdorff, hausdorffIqr, compileRate: parseFloat(compile) };
      if (name === 'GPT-4' && setting === 'Few-shot') {
        for (const [group, mechanism,, subsetCloud] of split.slice(1)) {
          if (mechanism !== feedback) continue;
          const key = group.replaceAll(' ', '');
          parts[key] = group;
          [metrics[key], metrics[key + 'Iqr']] = pair(subsetCloud);
        }
      }
      rows.push({ model, setting, harness: feedback === 'Generated' ? undefined : feedback.replace(' (Ours)', ''), score, metrics });
    }
    return checked(rows, 16);
  },
};
export default board;
