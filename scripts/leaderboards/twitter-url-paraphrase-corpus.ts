// The Twitter URL Paraphrase Corpus evaluates binary paraphrase identification on URL-linked tweet pairs.
// This importer reads Table 10 of the makers' paper, which reports F1, precision, and recall for each method.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/D17-1126.pdf';
const board: Leaderboard = {
  benchmark: 'twitter-url-paraphrase-corpus', static: 'paper', url: 'https://aclanthology.org/D17-1126/', feed: FEED,
  stats: { precision: { name: 'Precision', unit: 'score', better: 'higher' }, recall: { name: 'Recall', unit: 'score', better: 'higher' } },
  terms: 'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/D17-1126/',
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/Method\s+F1\s+Precision\s+Recall/).at(-1)?.split(/Table 10:/)[0];
    if (!table) throw new Error('Table 10 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.match(/(Random|Edit Distance|GloVe|LR|WMF \(vec\)|LEX-WMF \(vec\)|OrMF \(vec\)|LEX-OrMF \(vec\)|WMF \(sim\)|LEX-WMF \(sim\)|OrMF \(sim\)|LEX-OrMF \(sim\)|MultiP|DeepPairwiseWord)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m || m[1] === 'Random') continue;
      rows.push({ model: m[1], score: Number(m[2]), metrics: { precision: Number(m[3]), recall: Number(m[4]) } });
    }
    if (rows.length !== 13) throw new Error(`Expected 13 Table 10 model rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
