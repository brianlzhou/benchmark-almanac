// Surface Evolver: overall mean score, multiplied by 100, from the official interactive chart.
// Mean cost per run is per task. The source reports total tokens, not output tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://yhenon.github.io/surface-evolver-llm-eval/assets/charts/performance.html";
const board: Leaderboard = {
  benchmark: "surface-evolver-bench",
  url: "https://yhenon.github.io/surface-evolver-llm-eval/assets/charts/performance.html",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  chart: {"title": "Surface Evolver score versus cost", "x": {"key": "cost", "label": "Mean cost per task", "unit": "$", "better": "lower"}, "y": {"key": "score", "label": "Mean score", "unit": "%", "better": "higher"}},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=await fetchText(FEED);const d=jsonAfter<any>(s,'<script id="chart-data" type="application/json">');
      return d.models.map((r:any)=>({model:r.key.replace(/\s*\([^)]*\)$/,''),setting:r.key.match(/\(([^)]*)\)$/)?.[1],score:r.mean_score*100,cost:r.mean_total_cost_usd,metrics:{passRate:r.pass_rate*100,cost:r.mean_total_cost_usd,totalTokens:r.mean_total_tokens,runs:r.runs}}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
