// The Catalonia Independence Corpus tests stance classification in Catalan and Spanish tweets.
// The source reports no overall score. This importer computes the plain mean of the Catalan and Spanish macro F1 columns in Tables 9 and 10.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2020.lrec-1.171.pdf';
const values: Record<string, [number, number]> = {
  'SVM+TF-IDF': [70.90, 71.09], 'SVM+FTEmb': [61.95, 63.38], 'fastText+FTEmb': [71.47, 72.43], 'Flair+FTEmb': [58.96, 58.29],
};
const board: Leaderboard = {
  benchmark: 'catalonia-independence-corpus', static: 'paper',
  url: 'https://aclanthology.org/2020.lrec-1.171/', feed: FEED,
  terms: 'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',
  headline: 'The paper reports no overall score, so this is the plain mean of its Catalan and Spanish macro F1 scores.',
  parts: { catalanMacroF1: 'Catalan macro F1', spanishMacroF1: 'Spanish macro F1' },
  async fetch() {
    const body = await pdfText(FEED);
    if (!body.includes('Table 9: Results on the Catalan testset') || !body.includes('Table 10: Results on the Spanish testset')) throw new Error('Results tables missing');
    const rows: LeaderboardRow[] = Object.entries(values).map(([model, [ca, es]]) => ({ model, score: (ca + es) / 2, metrics: { catalanMacroF1: ca, spanishMacroF1: es } }));
    return checked(rows, 4);
  },
};
export default board;
