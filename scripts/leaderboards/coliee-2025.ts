// COLIEE evaluates legal retrieval and entailment. The Task 1 board reports case retrieval F1, precision and recall.
// The overview identifies the retrieval models in section 2.3: https://doi.org/10.1007/s12626-026-00199-9
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://coliee.org/COLIEE2025/results/task1';
const board: Leaderboard = {
  benchmark: 'coliee-2025', url: feed, feed,
  terms: 'COLIEE publishes these standings under its competition rules. https://coliee.org/COLIEE2025/rules',
  parts: { retrieval: 'Case Law Retrieval' }, harnesses: 'system',
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Team|File|F1|Precision|Recall');
    if (!table) throw new Error('COLIEE Task 1 results missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const [submitter, file, ...values] = row.map(c => c.text);
      let models: string[];
      if (submitter === 'UQLegalAI') models = ['CaseLink'];
      else if (submitter === 'SIL') models = ['LightGBM', 'MPNet'];
      else if (submitter === 'NOWJ') {
        models = file.includes('llm2vec') ? ['LLM2Vec', 'BGE-m3', 'Qwen-2.5'] : ['BGE-m3', 'Qwen-2.5'];
      } else if (submitter === 'AIIR Lab' && file.includes('mpmist')) models = ['Sentence-BERT', 'Mistral-7B'];
      else continue;
      if (values.length !== 3 || !values.every(v => /^[01]\.\d+$/.test(v))) throw new Error('Unexpected COLIEE score for ' + file);
      const [score, precision, recall] = values.map(v => Number((100 * Number(v)).toFixed(4)));
      rows.push({ model: models[0], models: models.length > 1 ? models : undefined, submitter, harness: file,
        score, metrics: { retrieval: score, precision, recall } });
    }
    return checked(rows, 9);
  },
};
export default board;
