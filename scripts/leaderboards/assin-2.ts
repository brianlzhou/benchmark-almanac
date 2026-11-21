// ASSIN 2 evaluates Portuguese textual entailment and semantic similarity.
// The official run sheet lists entailment F1 first and similarity Pearson correlation second.
// The organizers identify the Deep Learning Brasil ensemble and IPR's best run in Section 3.
// https://drive.google.com/file/d/1ft1VU6xiVm-N58dfAp6FHWjQ4IvcXgqp/view
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://docs.google.com/spreadsheets/d/1wNRx6MQbEBeJYKutlHhQidnoNBPyDZDdFoHK4Dpvge8';
const feed = url + '/export?format=csv';
const board: Leaderboard = {
  benchmark: 'assin-2', url, feed,
  terms: 'The ASSIN 2 organizers publish the official results sheet. https://sites.google.com/view/assin2',
  parts: { entailment: 'Entailment F1', similarity: 'Similarity Pearson correlation' },
  harnesses: 'system',
  async fetch() {
    const csv = await fetchText(feed);
    const start = csv.indexOf('Team,Run,F1*,Accuracy,Pearson*,MSE,');
    if (start < 0) throw new Error('Missing official ASSIN 2 score columns');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(csv.slice(start))) {
      const ensemble = r.Team === 'Deep Learning Brasil' && r.Run === 'Ensemble';
      if (!ensemble && !(r.Team === 'IPR' && r.Run === '1') && !(r.Team === 'Deep Learning Brasil' && r.Run === 'BERT')) continue;
      const values = [r['F1*'], r['Pearson*'], r.Accuracy, r.MSE];
      if (!values.every(v => /^-?\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid ASSIN 2 score');
      const [entailment, similarity, accuracy, mse] = values.map(Number);
      rows.push({ model: ensemble ? 'multilingual BERT' : 'BERT', submitter: r.Team, harness: r.Team,
        setting: 'Run ' + r.Run, ...(ensemble ? { models: ['multilingual BERT', 'RoBERTa'] } : {}),
        score: entailment, metrics: { entailment, similarity, accuracy, mse } });
    }
    return checked(rows, 3);
  },
};
export default board;
