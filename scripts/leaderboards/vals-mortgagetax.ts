// Vals published accuracy and per-test cost from the page’s live chart data. Table token prices are not used as task costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { valsDetails } from '../lib/boards/vals-details.ts';
import { VALS_ALIASES } from './vals-index.ts';
const FEED = "https://www.vals.ai/benchmarks/mortgage_tax";
const board: Leaderboard = {
 benchmark: "vals-mortgagetax",
 url: "https://www.vals.ai/benchmarks/mortgage_tax",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' } },
 aliases:Object.fromEntries(Object.entries(VALS_ALIASES).filter(([k])=>k!=='GPT 4o')),
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await valsDetails(board, "mortgage_tax", {cost: null});
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
