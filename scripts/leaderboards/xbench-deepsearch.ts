// The current default DeepSearch 2510 API publishes exact accuracy scores. Historical 2505 score bands are excluded. Product names without model snapshots remain unlisted. Cost strings mix subscriptions and usage, so no per-task cost is inferred.
// The generic Gemini Pro product label does not identify a Gemini generation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://admin.xbench-ai.com/api/deepsearch2510?populate[Leaderboard][populate]=company";
const board: Leaderboard = {
  benchmark: "xbench-deepsearch",
  url: "https://admin.xbench-ai.com/api/deepsearch2510?populate[Leaderboard][populate]=company",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=await fetchJson<any>(FEED);
return d.data.Leaderboard.map((r:any)=>{const m=r.product.match(/^(.+?)\s*\(([^)]+)\)$/);return {model:(m?m[1].trim():r.product)==='Gemini Pro'?'Gemini Pro (version unspecified)':(m?m[1].trim():r.product),setting:m?.[2],score:r.score,date:r.evaluationDate};});

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
