// TongGuOCR compares recognition accuracy on MTHv2 in Table 3 of its paper. The table distinguishes cropped-line and page recognition.
import type { Leaderboard } from './types.ts';
import { recognitionTable } from './m5hisdoc.ts';

const feed = "https://arxiv.org/pdf/2608.07917";


const board: Leaderboard = {
  benchmark: "mth-v2", static: 'paper',
  stats: { CR: { name: 'Character recognition', unit: '%', better: 'higher' }, NED: { name: 'Normalized edit distance', unit: '%', better: 'lower' }, F1: { name: 'F1 score', unit: '%', better: 'higher' }, P: { name: 'Precision', unit: '%', better: 'higher' }, R: { name: 'Recall', unit: '%', better: 'higher' }, BLEU: { name: 'BLEU score', unit: 'score', better: 'higher' }, 'RO-ED': { name: 'Reading-order edit distance', unit: '%', better: 'lower' } },
  url: "https://arxiv.org/pdf/2608.07917#page=12",
  feed,
  terms: "Table 3 includes three cropped-line baselines. The paper gives no separate reuse license for its table. https://arxiv.org/pdf/2608.07917#page=12 arXiv allows PDF access with a 15-second crawl delay.",
  host: 'TongGuOCR',
  fetch: () => recognitionTable(feed,12,'Table 3: Performance comparison',31),
};
export default board;
