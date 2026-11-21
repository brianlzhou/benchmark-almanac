// DEW-LogiQ compares two prompting strategies on agricultural water-management reasoning. The authors publish both accuracy columns in their results file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/MSU-CECO/awm-bench/main/src/data/results.json";

const board: Leaderboard = {
  benchmark: "dew-logiq",
  url: "https://dsiweb.cse.msu.edu/awm-bench/",
  feed,
  terms: "The authors request citation of the relevant paper. The leaderboard repository lists no reuse license. https://github.com/MSU-CECO/awm-bench The page host serves a challenge at robots.txt and the raw file host returns 404 there.",
  verified: 'Marked verified by the benchmark authors',
  aliases: { 'o3-medium': 'o3' },
  async fetch() {
    type Entry = { model: string; model_url: string; verified: boolean; metrics: { CoT: number; FLOW_Map: number } };
    const entries = (await fetchJson<Record<string, Entry[]>>(feed))['dew-logiq'];
    if (entries.length < 4) throw new Error('Missing DEW-LogiQ results');
    return entries.flatMap(r => {
      if (!r.model.endsWith(' + FLOW-Map') || ![r.metrics.CoT, r.metrics.FLOW_Map].every(Number.isFinite)) throw new Error('Incomplete DEW-LogiQ result');
      const model = r.model.replace(' + FLOW-Map', '');
      const base = { model, link: r.model_url, verified: r.verified };
      return [{ ...base, setting: 'FLOW-Map', score: r.metrics.FLOW_Map }, { ...base, setting: 'CoT', score: r.metrics.CoT }];
    });
  },
};

export default board;
