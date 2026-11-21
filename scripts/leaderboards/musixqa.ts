// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// MusiXQA tests sheet music understanding. Table 1 reports GPT-graded accuracy and string similarity for each task.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.23009';
const board: Leaderboard = {
  benchmark: 'musixqa', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2506.23009.',
  headline: 'The paper reports no overall score, so this is the mean GPT-graded accuracy across four sheet music tasks.',
  aliases: { 'Phi-3-V': 'phi-3-vision-128k-instruct' },
  parts: { ocr: 'OCR', omr: 'OMR', layout: 'Layout', chord: 'Chord' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const table = tables.find(t => t[0].join() === ',OCR,OCR,,OMR,OMR,,Layout,Layout,,Chord,Chord');
    if (!table || table[1].join() !== 'Accuracy,G-Acc,PNLS,,G-Acc,PNLS,,G-Acc,PNLS,,G-Acc,PNLS') throw new Error('Missing MusiXQA task metrics');
    const rows = [];
    for (const r of table.slice(2)) {
      if (r[0].startsWith('Finetuned on') || r.includes('-')) continue;
      const metrics: Record<string, number> = {};
      const parts = ['ocr', 'omr', 'layout', 'chord'];
      parts.forEach((key, i) => { metrics[key] = numberCell(r[1+i*3]); metrics[key+'PNLS'] = numberCell(r[2+i*3]); });
      const [name, harness] = r[0].split(/ \+ (.+)/);
      const model = name.split(' (')[0];
      const setting = name.includes(' (') ? name.slice(model.length+2, -1) : harness ? undefined : 'Zero-shot';
      rows.push({ model, setting, harness, metrics, score: parts.reduce((sum,key) => sum+metrics[key], 0)/4 });
    }
    return checked(rows, 6);
  },
};
export default board;
