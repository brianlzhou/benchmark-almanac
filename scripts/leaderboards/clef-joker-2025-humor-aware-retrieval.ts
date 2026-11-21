// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 4 and 5 score retrieval of humorous texts in English and Portuguese by mean average precision.
// The printed tables multiply MAP by 100. The discussion gives MAP on the 0 to 1 scale.
// The UAms system description identifies its reranker in footnote 2: https://ceur-ws.org/Vol-4038/paper_224.pdf
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4038/paper_218.pdf';
const board: Leaderboard = {
  benchmark: 'clef-joker-2025-humor-aware-retrieval', url: feed, feed, harnesses: 'system',
  terms: 'The authors publish their results in CEUR Workshop Proceedings. https://ceur-ws.org/Vol-4038/',
  parts: { English: 'English', Portuguese: 'Portuguese' },
  async fetch() {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const mode of ['bm25_CE1K', 'rm3_CE1K', 'top 100', 'top 1000']) {
      const uams = mode.endsWith('CE1K');
      const submitter = uams ? 'UAms' : 'Skommarkhos';
      const model = uams ? 'cross-encoder/ms-marco-MiniLM-L-12-v2' : 'intfloat/multilingual-e5-small';
      const metrics: Record<string, number> = {};
      for (const [language, abbreviation, count] of [['English', 'en', 207], ['Portuguese', 'pt', 69]] as const) {
        const table = paper.split('Results for Task 1 ' + language + ' (test data)')[1]?.split('\f')[0];
        if (!table || !/#ret\s+#rel\s+MAP\s+GMAP/.test(table)) throw new Error('Missing test table for ' + language);
        const key = uams ? 'UAms_' + abbreviation + '_' + mode : 'Skommarkhos_BM25_E5_MiniLM';
        const candidates = table.split('\n').map(line => line.trim().split(/\s+/)).filter(c => c[0] === key &&
          (uams || Number(c[1]) === count * (mode === 'top 100' ? 100 : 1000)));
        if (candidates.length !== 1) throw new Error('Ambiguous run ' + key);
        metrics[language] = Number(candidates[0][3]) / 100;
      }
      rows.push({ model, submitter, harness: submitter, setting: mode, metrics,
        ...(!uams ? { models: [model, 'cross-encoder/ms-marco-MiniLM-L12-v2'] } : {}),
        score: (metrics.English + metrics.Portuguese) / 2 });
    }
    return checked(rows, 4);
  },
};
export default board;
