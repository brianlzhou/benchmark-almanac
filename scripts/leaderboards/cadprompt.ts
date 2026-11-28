// CADPrompt asks for CAD programs that reproduce 200 reference parts from text.
// Table 2 gives median point cloud distance and interquartile range. Lower distance is better.
// Table 8 breaks out GPT-4 few-shot results by shape complexity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2410.05340';
const parts: Record<string, string> = {
  Simple: 'Simple',
  ModerateComplex: 'Moderate complexity',
  Complex: 'Complex',
  VeryComplex: 'Very complex',
};
function pair(s: string) {
  const m = /^([\d.]+) \(([\d.]+)\)$/.exec(s);
  if (!m) throw new Error('Expected median and IQR');
  return [Number(m[1]), Number(m[2])];
}
const board: Leaderboard = {
  benchmark: 'cadprompt', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish their evaluation in the paper. https://arxiv.org/abs/2410.05340',
  stats: {
    iogt: { name: 'Intersection over the ground truth', unit: 'score', better: 'higher', note: 'Bounding-box intersection area divided by the ground-truth area.' },
    hausdorff: { name: 'Hausdorff distance', unit: 'score', better: 'lower' },
    compileRate: { name: 'Compile rate', unit: '%', better: 'higher', note: 'Percentage of generated CAD programs that compile successfully.' },
    SimpleIogt: { name: 'Simple IoGT', unit: 'score', better: 'higher' },
    SimpleHausdorff: { name: 'Simple Hausdorff distance', unit: 'score', better: 'lower' },
    SimpleCompileRate: { name: 'Simple compile rate', unit: '%', better: 'higher' },
    ModerateComplexIogt: { name: 'Moderate complexity IoGT', unit: 'score', better: 'higher' },
    ModerateComplexHausdorff: { name: 'Moderate complexity Hausdorff distance', unit: 'score', better: 'lower' },
    ModerateComplexCompileRate: { name: 'Moderate complexity compile rate', unit: '%', better: 'higher' },
    ComplexIogt: { name: 'Complex IoGT', unit: 'score', better: 'higher' },
    ComplexHausdorff: { name: 'Complex Hausdorff distance', unit: 'score', better: 'lower' },
    ComplexCompileRate: { name: 'Complex compile rate', unit: '%', better: 'higher' },
    VeryComplexIogt: { name: 'Very complex IoGT', unit: 'score', better: 'higher' },
    VeryComplexHausdorff: { name: 'Very complex Hausdorff distance', unit: 'score', better: 'lower' },
    VeryComplexCompileRate: { name: 'Very complex compile rate', unit: '%', better: 'higher' },
  },
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
      const [score] = pair(cloud);
      const [iogt] = pair(overlap);
      const [hausdorff] = pair(distance);
      if (!/^[\d.]+%$/.test(compile)) throw new Error('Missing compile rate');
      const metrics: Record<string, number> = { iogt, hausdorff, compileRate: parseFloat(compile) };
      if (name === 'GPT-4' && setting === 'Few-shot') {
        for (const [group, mechanism, subsetOverlap, subsetCloud, subsetHausdorff, subsetCompile] of split.slice(1)) {
          if (mechanism !== feedback) continue;
          const key = group.replaceAll(' ', '');
          [metrics[key]] = pair(subsetCloud);
          [metrics[key + 'Iogt']] = pair(subsetOverlap);
          [metrics[key + 'Hausdorff']] = pair(subsetHausdorff);
          if (/^[\d.]+%$/.test(subsetCompile)) metrics[key + 'CompileRate'] = parseFloat(subsetCompile);
        }
      }
      rows.push({ model, setting, harness: feedback === 'Generated' ? undefined : feedback.replace(' (Ours)', ''), score, metrics });
    }
    return checked(rows, 16);
  },
};
export default board;
