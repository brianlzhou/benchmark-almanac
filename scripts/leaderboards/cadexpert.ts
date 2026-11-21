// CADExpert tests CadQuery generation from engineering drawings. Table 1 reports volumetric
// intersection over union in percent, Chamfer distances and the percentage of executable programs.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2512.23333';
const board: Leaderboard = {
  benchmark: 'cadexpert', static: 'paper', url: feed, feed,
  terms: 'The paper uses the arXiv perpetual non-exclusive license. https://arxiv.org/abs/2512.23333',
  stats:{meanCD:{name:'Mean Chamfer distance',unit:'score',better:'lower'},medianCD:{name:'Median Chamfer distance',unit:'score',better:'lower'},executionRate:{name:'Execution rate',unit:'%',better:'higher'}},
  aliases: { 'GPT5-Mini': 'gpt-5-mini', 'Phi-3.5-Vision': 'phi-3-5-vision-instruct' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.map(cell => cell.split('\\')[0]).join('|') === 'Model|IOU(%)|Mean CD|Med CD|Exec.(%)' &&
      t[1]?.[0].includes('LLaVA'));
    if (!table) throw new Error('Missing CADExpert comparison');
    return checked(table.slice(1).map(([name, iou, meanCD, medCD, execution]) => {
      const model = name === 'Ours' ? 'CME-CAD' : name.replace(/(?:\\ast)?\s*\[\s*\d+\s*\]$/, '');
      const setting = ['CME-CAD', 'CAD-RL'].includes(model) ? 'Fine-tuned' : 'Pretrained';
      return { model, setting, score: numberCell(iou),
        metrics: { meanCD: numberCell(meanCD), medianCD: numberCell(medCD), executionRate: numberCell(execution) } };
    }), 11);
  },
};
export default board;
