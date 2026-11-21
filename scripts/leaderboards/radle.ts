// RadLE 1.0 asks models to give a diagnosis from images alone on 50 radiology cases.
// The paper's overall results table reports mean accuracy over three runs with a 95% confidence interval.
// Its modality and clinical-system tables give accuracy and intervals for each subset.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2509.25559';
const board: Leaderboard = {
  benchmark: 'radle', url: feed, feed, static: 'paper',
  terms: 'The authors publish the paper under the terms linked at https://arxiv.org/abs/2509.25559.',
  aliases: { 'OpenAI o3': 'o3' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'Group|Mean Accuracy|95% CI');
    if (!main) throw new Error('Missing RadLE accuracy table');
    const parts: Record<string, BoardPart> = {};
    const rows = main.slice(1).filter(r => !/radiologists|trainees/i.test(r[0])).map(([model, accuracy, ci]) => {
      const bounds = ci.split('–').map(x => numberCell(x) * 100);
      if (bounds.length !== 2) throw new Error('Missing RadLE confidence interval');
      const metrics: Record<string, number> = {};
      for (const [column, group] of [['Modality', 'Modality'], ['System (n)', 'Clinical system']]) {
        const table = tables.find(t => t[0]?.[0] === column && t[0]?.[1] === 'Radiologists');
        const i = table?.[0].indexOf(model) ?? -1;
        if (!table || i < 0) throw new Error('Missing RadLE subset table');
        for (const r of table.slice(1)) {
          const name = r[0].replace(/ \(n=\d+\)$/, '').replace('Paediatric', 'Pediatric');
          const values = r[i].match(/^([\d.]+) \(([\d.]+)–([\d.]+)\)$/);
          if (!values) throw new Error('Missing RadLE subset accuracy or confidence interval');
          parts[name] = {name, group};
          metrics[name] = numberCell(values[1]) * 100;
          metrics[name + 'Low'] = numberCell(values[2]) * 100;
          metrics[name + 'High'] = numberCell(values[3]) * 100;
        }
      }
      return { model, score: numberCell(accuracy) * 100, low: bounds[0], high: bounds[1], trials: 3, metrics };
    });
    board.parts = parts;
    return checked(rows, 5);
  },
};
export default board;
