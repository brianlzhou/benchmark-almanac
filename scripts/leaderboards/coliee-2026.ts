// COLIEE evaluates legal retrieval, entailment and judgment prediction with different task metrics.
// The first leaderboard ranks case retrieval by micro F1. The teams identify these systems in the 2026 proceedings.
// Precision and recall stay beside F1. The three component ensemble uses the same stages as its JNLP single-classifier runs.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://coliee.org/COLIEE2026/results/task1';
const entries: Record<string, {model:string, models?:string[]}> = {
  'JNLP/random_forest':{model:'Random Forest'},
  'JNLP/xgboost':{model:'XGBoost'},
  'JNLP/ensemble':{model:'Random Forest',models:['Random Forest','XGBoost','Multilayer Perceptron']},
  'BJPWH/bjpwh1':{model:'all-MiniLM-L6-v2'},
  'BJPWH/bjpwh2':{model:'BM25'},
  'BJPWH/bjpwh3':{model:'all-MiniLM-L6-v2',models:['all-MiniLM-L6-v2','BM25']},
  'NOWJ/submission_1':{model:'Qwen3-Reranker-8B',models:['Qwen3-Reranker-4B','Qwen3-Reranker-8B']},
  'NOWJ/submission_2':{model:'MLP',models:['MLP','flan-t5-xl','multilingual-e5-large-instruct']},
  'NOWJ/submission_3':{model:'MLP',models:['MLP','flan-t5-xl','multilingual-e5-large-instruct','Qwen3-Reranker-4B','Qwen3-Reranker-8B']},
};
const board: Leaderboard = {
  benchmark:'coliee-2026',url:feed,feed,harnesses:'system',
  terms:'COLIEE publishes the official results at https://coliee.org/COLIEE2026/results/task1 and credits the submitting teams.',
  stats:{precision:{name:'Precision',unit:'%',better:'higher'},recall:{name:'Recall',unit:'%',better:'higher'}},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t=>t[0]?.map(c=>c.text).join('|')==='Team|Run|F1|Precision|Recall');
    if (!table) throw new Error('Missing Task 1 result columns');
    const rows = [];
    for (const cells of table.slice(1)) {
      const [submitter,run,...values] = cells.map(c=>c.text);
      const entry = entries[submitter+'/'+run];
      if (!entry) continue;
      if (values.length !== 3 || values.some(v=>!/^(?:0|1)\.\d+$/.test(v))) throw new Error('Invalid official result');
      const [score,precision,recall] = values.map(v=>Number((Number(v)*100).toFixed(3)));
      rows.push({...entry,submitter,harness:submitter+' '+run,score,metrics:{precision,recall}});
    }
    return checked(rows, Object.keys(entries).length);
  },
};
export default board;
