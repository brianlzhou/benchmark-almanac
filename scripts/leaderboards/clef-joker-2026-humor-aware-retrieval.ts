// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Tables 2 and 3 rank English and Hinglish joke retrieval by mean average precision (MAP).
// Section 4 identifies the RIVER pipeline and the Okapi BM25 retrieval model used by arjun108.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-4283/paper302.pdf';
const runs = [
  { submitter: 'madhangi', model: 'BM25', ids: ['BM25', 'BM25'] },
  { submitter: 'arjun108', model: 'Okapi BM25', harness: 'S1_1', ids: ['S1_1', 'S1_1'] },
  { submitter: 'xinrui_qiu', model: 'paraphrase-multilingual-mpnet-base-v2', models: ['paraphrase-multilingual-mpnet-base-v2', 'roberta-base'],
    harness: 'RIVER', ids: ['MPNetRoBERTa', 'RIVER_task_1_MPNetRoBERTa'] },
];
const board: Leaderboard = {
  benchmark: 'clef-joker-2026-humor-aware-retrieval', url: feed, feed, static: 'paper',
  headline: 'Plain mean of the English and Hinglish track MAP scores.',
  terms: 'The organizers publish the overview under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  stats: Object.fromEntries(['englishNdcg5','englishNdcg10','englishNdcg100','englishMrr','englishPrecision10','hinglishNdcg5','hinglishNdcg10','hinglishNdcg100','hinglishMrr','hinglishPrecision10'].map(key => {
    const metric = key.replace(/^(english|hinglish)/, '').replace('Ndcg', 'NDCG@').replace('Mrr', 'MRR').replace('Precision10', 'P@10');
    return [key, { name: `${key.startsWith('english') ? 'English' : 'Hinglish'} ${metric}`, unit: 'score', better: 'higher' }];
  })),
  parts: { english: 'English', hinglish: 'Hinglish' }, harnesses: 'system',
  async fetch() {
    const paper = await pdfText(feed);
    const tracks = ['English', 'Hinglish'].map(track => {
      const table = paper.split('Official evaluation results for Task 1 (' + track + ' Track)')[1]?.split(/\n\s*\n/)[0];
      if (!table || !/MAP\s+NDCG\s+MRR\s+Prec\s+Run ID/.test(table)) throw new Error('Missing ' + track + ' rankings');
      return table.split('\n').map(line => line.trim().split(/\s{2,}/));
    });
    return checked(runs.map(({ ids, ...run }) => {
      const metrics: Record<string, number> = {};
      tracks.forEach((track, i) => {
        const lang = i === 0 ? 'english' : 'hinglish';
        const row = track.find(c => c[1] === run.submitter && c.at(-1) === ids[i]);
        const scores = row?.slice(2, 8);
        if (!scores || scores.length !== 6 || !scores.every(v => /^[01]\.\d+$/.test(v))) throw new Error('Missing ranked run ' + ids[i]);
        ['','Ndcg5','Ndcg10','Ndcg100','Mrr','Precision10'].forEach((suffix, j) => { metrics[lang + suffix] = Number(scores[j]); });
      });
      return { ...run, metrics, score: (metrics.english + metrics.hinglish) / 2 };
    }), 3);
  },
};
export default board;
