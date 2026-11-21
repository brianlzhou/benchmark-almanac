// GreekBarRetrieval measures how well systems rank applicable statutory articles for Greek bar exam questions.
// Table 3 lists nDCG@10 first. Table 17 supplies per-query costs and token usage for selected systems.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2608.18752';
const board: Leaderboard = {
  benchmark: 'greekbarretrieval', static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the terms at https://arxiv.org/abs/2608.18752.',
  aliases: { 'Qwen3-8B': 'qwen3-embedding-8b', 'Qwen3-4B': 'qwen3-embedding-4b', 'Qwen3-0.6B': 'qwen3-embedding-0-6b' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0].join('|') === 'Model|N@10|N@100|R@10|R@100|MAP');
    const costs = tables.find(t => t[0].join('|') === 'System|Calls/q|Time/q|Embed tok/q|LLM tok/q|USD/q|retrieval pool cost');
    if (!t || !costs) throw new Error('Missing main results or cost table');
    return checked(t.slice(1).filter(r => r[0] !== r[1]).map(([name, ndcg, ndcg100, recall10, recall100, map100]) => {
      const metrics: Record<string, number> = { ndcg100: numberCell(ndcg100), recall10: numberCell(recall10),
        recall100: numberCell(recall100), map100: numberCell(map100) };
      const costName = name.replace(/\bBM25$/, 'BM25-GreekStemmer');
      const c = costs.find(r => r[0] === (name === 'ReAct-BM25' ? 'ReAct-BM25 (10 rounds)' : costName));
      let cost: number | undefined;
      if (c) {
        cost = numberCell(c[5]);
        metrics.callsPerQuery = numberCell(c[1]);
        metrics.secondsPerQuery = numberCell(c[2].slice(0,-1)) * (c[2].endsWith('m') ? 60 : 1);
        const tokenCounts = c.slice(3,5).filter(s => s !== '–').map(s => numberCell(s.replace(/k$/, '')) * (s.endsWith('k') ? 1000 : 1));
        if (tokenCounts.length) metrics.totalTokens = tokenCounts.reduce((sum, n) => sum + n, 0);
        if (c[6] !== '–') metrics.retrievalPoolCost = numberCell(c[6]);
      }
      const denseRewrite = name === 'Reform- Qwen3-8B';
      const sparseRewrite = name === 'Reform- BM25' || name === 'ReAct-BM25';
      const model = denseRewrite ? 'Qwen3-8B' : sparseRewrite ? 'gpt-oss-120b' : name;
      return { model, score: numberCell(ndcg), metrics, cost, harness: denseRewrite || sparseRewrite ? name : undefined,
        models: denseRewrite ? [model, 'gpt-oss-120b'] : undefined };
    }), 13);
  },
};
export default board;
