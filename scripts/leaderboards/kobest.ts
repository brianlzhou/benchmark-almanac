// KoBEST measures Korean language understanding on five tasks.
// Table 4 reports average test F1 and each task's F1. Fine-tuning results include standard deviations across five runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aclanthology.org/2022.coling-1.325.pdf';
const parts = { boolq: 'KB-BoolQ', copa: 'KB-COPA', wic: 'KB-WiC', hellaswag: 'KB-HellaSwag', sentineg: 'KB-SentiNeg' };
const board: Leaderboard = {
  benchmark: 'kobest', url: 'https://aclanthology.org/2022.coling-1.325/', feed, parts, static: 'paper',
  terms: 'ACL publishes the KoBEST study at https://aclanthology.org/2022.coling-1.325/.',
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.split('Table 4: The test F1 scores')[0].split('\f').at(-1);
    if (!table || !/KB-BoolQ\s+KB-COPA\s+KB-WiC\s+KB-HellaSwag\s+KB-SentiNeg\s+Average/.test(table)) throw new Error('Missing KoBEST Table 4');
    return checked([...table.matchAll(/^\s*(\S+) \((FT|k = \d+)\)\s+([\d±. \t]+)$/gm)].map(match => {
      const cells = match[3].trim().split(/\s+/);
      if (cells.length !== 6) throw new Error('Missing KoBEST task results');
      const metrics: Record<string, number> = {};
      Object.keys(parts).forEach((key, i) => {
        const [mean, deviation] = cells[i].split('±').map(numberCell);
        metrics[key] = mean;
        if (deviation !== undefined) metrics[key + 'Std'] = deviation;
      });
      const tuned = match[2] === 'FT';
      return { model: match[1], setting: tuned ? 'Fine-tuned' : match[2].slice(4) + '-shot',
        trials: tuned ? 5 : undefined, score: numberCell(cells[5]), metrics };
    }), 7);
  },
};
export default board;
