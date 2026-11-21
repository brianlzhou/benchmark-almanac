// Valerius Flaccus Intertextuality evaluates Latin word embeddings on synonym selection and ranking tasks.
// The source reports no overall score, so the headline is the first Selection (%) column from Table 1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2021.naacl-main.389.pdf';
const board: Leaderboard = {
  benchmark: 'valerius-flaccus-intertexts', static: 'paper', url: 'https://aclanthology.org/2021.naacl-main.389/', feed: FEED,
  terms: 'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/2021.naacl-main.389/',
  headline: 'The paper reports no overall score, so this is the Selection (%) column, the first task in its main table.',
  parts: { selection: { name: 'Selection' }, rankingTop1: { name: 'Ranking top 1' }, rankingTop10: { name: 'Ranking top 10' }, rankingTop25: { name: 'Ranking top 25' }, rankingMrr: { name: 'Ranking MRR' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/Model\s+Selection \(%\)\s+Ranking \(%\)/)[1]?.split(/Table 1:/)[0];
    if (!table) throw new Error('Table 1 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(Bamman|Grave et al\. \(2018\)|Sprugnoli et al\. \(2019\) \(word2vec CBOW\)|Sprugnoli et al\. \(2019\) \(FastText SG\)|Bloem et al\. \(2020\)|word2vec \(CLTK\)|word2vec \(TT\))\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) continue;
      rows.push({ model: m[1], score: Number(m[2]), metrics: { rankingTop1: Number(m[3]), rankingTop10: Number(m[4]), rankingTop25: Number(m[5]), rankingMrr: Number(m[6]) } });
    }
    if (rows.length !== 7) throw new Error(`Expected 7 Table 1 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
