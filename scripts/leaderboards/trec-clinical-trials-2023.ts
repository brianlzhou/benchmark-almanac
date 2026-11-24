// TREC ranks clinical trials for patient questionnaires by nDCG at rank 10.
// Table 1 of CSIROmed's track paper identifies its retrieval runs and reports official evaluation results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://trec.nist.gov/pubs/trec32/papers/CSIROmed.C.pdf';
const board: Leaderboard = {
  benchmark: 'trec-clinical-trials-2023', static: 'paper', feed, url:feed,
  terms: 'NIST publishes the participant paper at https://trec.nist.gov/pubs/trec32/papers/CSIROmed.C.pdf.',
  harnesses:'system',
  stats: { precision: { name: 'Precision at 10', unit: 'score' }, rr: { name: 'Reciprocal rank', unit: 'score' } },
  async fetch() {
    const paper = await pdfText(feed);
    const t = paper.match(/Method\s+Run name\s+NDCG@10\s+P@10\s+RR([\s\S]*?)Table 1:/)?.[1];
    if (!t || !paper.includes('text-embedding-ada-002')) throw new Error('Missing CSIROmed run results');
    const rows: LeaderboardRow[] = [];
    for (const line of t.trim().split('\n')) {
      const [method,run,score,precision,rr] = line.trim().split(/\s{2,}/);
      if (method === 'TREC median') continue;
      if (![score,precision,rr].every(v => /^0\.\d+$/.test(v))) throw new Error('Malformed CSIROmed row');
      const model = run === 'bm25_bsln' ? 'Solr BM25' : run === 'qe_err' ? 'text-embedding-ada-002' : 'gpt-3.5-turbo';
      const models = run === 'qe_err' ? [model,'gpt-3.5-turbo'] : undefined;
      rows.push({model,models,submitter:'CSIROmed',harness:method,score:Number(score),metrics:{precision:Number(precision),rr:Number(rr)}});
    }
    return checked(rows,5);
  },
};
export default board;
