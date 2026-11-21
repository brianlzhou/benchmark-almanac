// ClimateCheck tests scientific evidence retrieval, claim verification and narrative classification.
// Tables 2 and 3 report different measures. The headline is the first ranked measure, Score1.1 for retrieval.
// The ClimateSense and DFKI-IML system papers identify their retrieval models and pipelines.
// https://aclanthology.org/2026.nslp-1.7/ and https://aclanthology.org/2026.nslp-1.25/
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.nslp-1.6.pdf';
const teams = [
  { team: 'Baseline', model: 'ms-marco-MiniLM-L12-v2', models: ['e5-large-v2', 'ms-marco-MiniLM-L12-v2', 'DeBERTa', 'Qwen3-8B'] },
  { team: 'ClimateSense', model: 'BGE-Reranker-Large', models: ['BGE-Reranker-Large', 'BGE-Reranker-v2-m3', 'gpt-oss-120b', 'GPT 5.2'] },
  { team: 'DFKI-IML', model: 'ms-marco-MiniLM-L6-v2' },
];
function values(table: string, team: string, width: number) {
  const row = table.split('\n').find(line => line.trimStart().startsWith(team + ' '));
  const numbers = row?.match(/\b0\.\d{3}\b|\b1\.\d{3}\b/g)?.map(Number);
  if (!numbers || numbers.length !== width) throw new Error('Missing results for ' + team);
  return numbers;
}
const board: Leaderboard = {
  benchmark: 'climatecheck-2026', url: 'https://aclanthology.org/2026.nslp-1.6/', feed,
  terms: 'ACL Anthology provides this paper under its publication terms. https://aclanthology.org/faq/copyright/',
  harnesses: 'system',
  stats: {
    recallAt2: { name: 'Recall@2', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    recallAt5: { name: 'Recall@5', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    bpref: { name: 'Binary preference', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    f1: { name: 'F1', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
  },
  parts: { retrieval: 'Abstract retrieval', verification: 'Claim verification', narrative: 'Disinformation narrative classification' },
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/Team\s+R@2\s+R@5\s+Bpref\s+Score1\.1\s+P\s+R\s+F1\s+Score1\.2([\s\S]+?)Table 2: Results for Task 1/);
    const narrative = text.match(/Team\s+P \(macro\)\s+R \(macro\)\s+F1 \(macro\)\s+F1 \(micro\)\s+F1 \(weighted\)([\s\S]+?)Table 3: Results for Task 2/);
    if (!table || !narrative) throw new Error('ClimateCheck results tables missing');
    return checked(teams.map(({ team, model, models }) => {
      const [recallAt2, recallAt5, bpref, retrieval, precision, recall, f1, verification] = values(table[1], team, 8);
      const metrics: Record<string, number> = { recallAt2, recallAt5, bpref, retrieval, precision, recall, f1, verification };
      if (team !== 'DFKI-IML') {
        const [macroPrecision, macroRecall, macroF1, microF1, weightedF1] = values(narrative[1], team, 5);
        Object.assign(metrics, { macroPrecision, macroRecall, narrative: macroF1, microF1, weightedF1 });
      }
      return { model, models, submitter: team, harness: team + ' pipeline', score: retrieval, metrics };
    }), 3);
  },
};
export default board;
