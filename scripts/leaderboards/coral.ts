// CORAL evaluates passage retrieval, answer generation and citation labeling in multi-turn conversations.
// Table 2 reports mean reciprocal rank for the original October 2024 test protocol. The generation and citation experiments use different systems.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2410.23090';
const board: Leaderboard = {
  benchmark:'coral', url:feed, feed, static:'paper',
  terms:'The CORAL project uses MIT. https://github.com/Ariya12138/CORAL/blob/main/LICENSE',
  headline:'The paper gives no combined score, so this is mean reciprocal rank on its first task, conversational passage retrieval.',
  parts:{mrr:'Mean reciprocal rank', map:'Mean average precision', ndcgAt3:'NDCG@3', recallAt20:'Recall@20', recallAt100:'Recall@100'},
  async fetch() {
    const html = await paperHtml(feed);
    if (!html.includes('2410.23090v1')) throw new Error('Original CORAL paper version changed');
    const t = paperTables(html).map(grid).find(t=>t[0].join('|') === 'Category|Method|MRR|MAP|NDCG@3|Recall@20|Recall@100');
    if (!t) throw new Error('Missing conversational retrieval table');
    return checked(t.slice(1).map(([category,method,...values])=>{
      const [mrr,map,ndcgAt3,recallAt20,recallAt100] = values.map(numberCell);
      const llm4cs = method === 'LLM4CS (GPT-3.5)';
      return {model:llm4cs ? 'GPT-3.5' : method, harness:llm4cs ? 'LLM4CS' : undefined,
        setting:'October 2024 CORAL test, ' + category.replace(' Models',''), score:mrr,
        metrics:{mrr,map,ndcgAt3,recallAt20,recallAt100}};
    }),7);
  },
};
export default board;
