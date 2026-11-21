// Ricotoma rates Pokémon doubles agents from best-of-three series winners. Its JSON feed includes ratings, uncertainty and canonical run costs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://ricotoma.com/pokemon-bench/evidence/source/benchmark-data.json";
const board: Leaderboard = {
  benchmark: "pokemon-vgc-bench-ricotoma",
  url: "https://ricotoma.com/pokemon-bench",
  feed,
  terms: "Ricotoma publishes scores and cost estimates. The dashboard gives no reuse license. The site permits crawling.",
  costPer: 'run',
  stats: { seriesWins: { name: 'Series wins', unit: 'count' }, seriesLosses: { name: 'Series losses', unit: 'count' }, gameWins: { name: 'Game wins', unit: 'count' }, gameLosses: { name: 'Game losses', unit: 'count' }, calls: { name: 'Calls', unit: 'count' }, inputTokens: { name: 'Input tokens', unit: 'tokens' }, cachedInputTokens: { name: 'Cached input tokens', unit: 'tokens' }, outputTokens: { name: 'Output tokens', unit: 'tokens' }, reasoningTokens: { name: 'Reasoning tokens', unit: 'tokens' }, totalTokens: { name: 'Total tokens', unit: 'tokens' }, paidCalls: { name: 'Paid calls', unit: 'count' }, paidTotalTokens: { name: 'Paid total tokens', unit: 'tokens' }, paidEstimatedCostUsd: { name: 'Estimated paid cost', unit: 'usd', better: 'lower' } },
  async fetch() {
    type Entry = { name:string; status:string; rating:number; ciLow:number; ciHigh:number; reasoningLevels:string[];
      seriesWins:number; seriesLosses:number; gameWins:number; gameLosses:number; estimatedCostUsd:number|null;
      calls:number; inputTokens:number; cachedInputTokens:number; outputTokens:number; reasoningTokens:number; totalTokens:number;
      paidCalls:number; paidTotalTokens:number; paidEstimatedCostUsd:number|null };
    const data = await fetchJson<{leaderboard:Entry[]}>(feed);
    const rows = data.leaderboard.filter(r => r.status === 'ranked').map(r => {
      if (!r.name || ![r.rating,r.ciLow,r.ciHigh,r.seriesWins,r.seriesLosses].every(Number.isFinite)) throw new Error('Incomplete Pokémon rating');
      const { seriesWins, seriesLosses, gameWins, gameLosses, calls, inputTokens, cachedInputTokens, outputTokens, reasoningTokens, totalTokens, paidCalls, paidTotalTokens } = r;
      return { model:r.name, score:r.rating, low:r.ciLow, high:r.ciHigh, setting:r.reasoningLevels.join(', '),
        cost:r.estimatedCostUsd ?? undefined, trials:seriesWins + seriesLosses,
        metrics:{ seriesWins, seriesLosses, gameWins, gameLosses, calls, inputTokens, cachedInputTokens, outputTokens, reasoningTokens, totalTokens,
          paidCalls, paidTotalTokens, ...(r.paidEstimatedCostUsd != null ? { paidEstimatedCostUsd:r.paidEstimatedCostUsd } : {}) } };
    });
    if (rows.length < 16) throw new Error('Missing ranked agents');
    return rows;
  },
};
export default board;
