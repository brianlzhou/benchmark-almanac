// The current default DeepSearch 2510 API publishes exact accuracy scores. Historical 2505 score bands are excluded. Product names without model snapshots remain unlisted. Keep reported dollar amounts separately and record explicitly free runs at zero cost. Read latency in seconds.
// The generic Gemini Pro product label does not identify a Gemini generation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://admin.xbench-ai.com/api/deepsearch2510?populate[Leaderboard][populate]=company";
const board: Leaderboard = {
  benchmark: "xbench-deepsearch",
  url: "https://admin.xbench-ai.com/api/deepsearch2510?populate[Leaderboard][populate]=company",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  stats: {
    reportedPriceUSD: { name: 'Reported query price', unit: 'usd', better: 'lower', note: 'Dollar amount shown in the source cost column.' },
    latency: { name: 'Query time', unit: 'seconds', better: 'lower', note: 'Reported query duration converted from minutes.' },
    latencyMin: { name: 'Minimum query time', unit: 'seconds', better: 'lower', note: 'Lower bound of the source time range, converted from minutes.' },
    latencyMax: { name: 'Maximum query time', unit: 'seconds', better: 'lower', note: 'Upper bound of the source time range, converted from minutes.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=await fetchJson<any>(FEED);
return d.data.Leaderboard.map((r: {product: string; score: number; evaluationDate?: string; cost?: string; timeCost?: string; company?: {name?: string}}) => {
  const mode = r.product.match(/^(.+?)\s*\(([^)]+)\)$/);
  const product = mode ? mode[1].trim() : r.product;
  const price = r.cost?.trim().match(/^~?\$([\d.]+)$/);
  const time = r.timeCost?.trim().match(/^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?min$/);
  const metrics: Record<string, number> = {};
  if (price) metrics.reportedPriceUSD = Number(price[1]);
  if (time?.[2]) {
    metrics.latencyMin = Number(time[1]) * 60;
    metrics.latencyMax = Number(time[2]) * 60;
  } else if (time) metrics.latency = Number(time[1]) * 60;
  return {
    model: product === 'Gemini Pro' ? 'Gemini Pro (version unspecified)' : product,
    setting: mode?.[2], score: r.score, date: r.evaluationDate, agentOrg: r.company?.name,
    cost: r.cost?.trim() === 'Free' ? 0 : undefined, metrics,
  };
});

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
