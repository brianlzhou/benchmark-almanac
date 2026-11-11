// 4DCodeBench: published overall score across all 200 scenes, including penalties for missing renders.
// The source defines overall as the mean of five reconstruction families. Costs and output tokens are means per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://4dcodebench.com/data/leaderboard.json";
const board: Leaderboard = {
  benchmark: "4dcodebench",
  url: "https://4dcodebench.com/data/leaderboard.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  chart: {"title": "4DCodeBench score versus cost", "x": {"key": "cost", "label": "Mean cost per task", "unit": "$", "better": "lower", "log": true}, "y": {"key": "score", "label": "Overall score", "unit": "score", "better": "higher"}},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED); await new Promise(r=>setTimeout(r,1100)); const registry=await fetchJson<any>('https://4dcodebench.com/models.json');
      return d.models.map((r:any)=>{const m=registry.models.find((m:any)=>m.key===r.run);if(!m)throw new Error('Unknown model run '+r.run);return {model:m.name,setting:m.effort||undefined,harness:r.harness,score:r.overall,cost:r.cost_usd,tokens:r.out_tokens,metrics:Object.fromEntries(Object.entries({...r.families,elo:r.elo,humanElo:r.human_elo,totalTokens:r.tokens,cost:r.cost_usd,steps:r.steps}).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)))};});
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
