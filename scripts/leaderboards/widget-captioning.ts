// Widget Captioning evaluates multimodal models that generate descriptions for unlabeled mobile UI elements.
// This importer reads Table 3 of the paper and uses full-test BLEU-1 as the headline, retaining all other metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2020.emnlp-main.443.pdf';
const board: Leaderboard = {
  benchmark: 'widget-captioning', static: 'paper', url: 'https://aclanthology.org/2020.emnlp-main.443/', feed: FEED,
  terms: 'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/2020.emnlp-main.443/',
  headline: 'The paper reports several captioning metrics, so the headline is full-test BLEU-1, the first metric in Table 3.',
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/Model Configuration\s+BLEU-1/)[1]?.split(/Predicate-Object Subset/)[0];
    if (!table) throw new Error('Table 3 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(Pixel Only|Pixel\+Local|Pixel\+Local\+Context \(PLC\)|PLC Classification)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) continue;
      rows.push({ model: m[1], setting: 'Full Test Set', score: Number(m[2]), metrics: { BLEU2: Number(m[3]), ROUGE: Number(m[4]), CIDEr: Number(m[5]), METEOR: Number(m[6]), SPICE: Number(m[7]) } });
    }
    if (rows.length !== 4) throw new Error(`Expected 4 model rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
