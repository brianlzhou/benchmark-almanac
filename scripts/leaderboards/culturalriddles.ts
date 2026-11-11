// CulturalRiddles: overall human-evaluated accuracy from the official dashboard.
// Reasoning and search configurations remain settings. Exact match and community coverage remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/CohereLabsCommunity/CulturalRiddles/raw/main/index.html";
const board: Leaderboard = {
  benchmark: "culturalriddles",
  url: "https://huggingface.co/spaces/CohereLabsCommunity/CulturalRiddles/raw/main/index.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {'Apertus 70B Instruct':'apertus-70b'},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=jsonAfter<any>(await fetchText(FEED),'const D = adapt(');
      return d.leaderboard.map((r:any)=>({model:r.model.replace(/\s*\[[^\]]+\]$/,''),setting:r.model.match(/\[([^\]]+)\]$/)?.[1]||r.reasoning,score:r.human_accuracy,metrics:{exactMatch:r.exact_match,evaluatedCommunities:r.n_evaluated_communities,evaluatedRiddles:r.n}}));
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
