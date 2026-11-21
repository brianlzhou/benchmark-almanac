// 4DCodeBench: published overall score across all 200 scenes, including penalties for missing renders.
// Read open-weight marks, rendered scene counts and real and synthetic scene statistics.
// The source defines overall as the mean of five reconstruction families. Costs and output tokens are means per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://4dcodebench.com/data/leaderboard.json";
const board: Leaderboard = {
  benchmark: "4dcodebench",
  parts: {
    Perceptual: { name: 'Perceptual', group: 'Dimension' },
    '2D Dynamics': { name: '2D dynamics', group: 'Dimension' },
    '2.5D Geometry': { name: '2.5D geometry', group: 'Dimension' },
    '3D Geometry': { name: '3D geometry', group: 'Dimension' },
    '3D Dynamics': { name: '3D dynamics', group: 'Dimension' },
  },
  stats: {
    VQA: { name: 'Visual question answering score', unit: 'score', better: 'higher', note: 'Share of scene-specific yes/no questions answered correctly from the rendered video.' },
    elo: { name: 'Vision-language model Elo', unit: 'elo', better: 'higher', note: 'Bradley-Terry rating from pairwise comparisons across the 200 tasks.' },
    humanElo: { name: 'Human Elo', unit: 'elo', better: 'higher', note: 'Bradley-Terry rating from human preference comparisons.' },
    totalTokens: { name: 'Total tokens', unit: 'tokens', note: 'Mean tokens used per task over the model’s 200 runs.' },
    steps: { name: 'Steps per task', unit: 'count', note: 'Mean generation steps per task.' },
    rendered: { name: 'Rendered scenes', unit: 'count', note: 'Number of scenes rendered by the model out of 200.' },
    realElo: { name: 'Real-scene Elo', unit: 'elo', better: 'higher' },
    realHumanElo: { name: 'Real-scene human Elo', unit: 'elo', better: 'higher' },
    realVqa: { name: 'Real-scene VQA score', unit: 'score', better: 'higher' },
    realCost: { name: 'Real-scene cost per task', unit: 'usd', better: 'lower' },
    realTotalTokens: { name: 'Real-scene total tokens', unit: 'tokens' },
    syntheticElo: { name: 'Synthetic-scene Elo', unit: 'elo', better: 'higher' },
    syntheticHumanElo: { name: 'Synthetic-scene human Elo', unit: 'elo', better: 'higher' },
    syntheticVqa: { name: 'Synthetic-scene VQA score', unit: 'score', better: 'higher' },
    syntheticCost: { name: 'Synthetic-scene cost per task', unit: 'usd', better: 'lower' },
    syntheticTotalTokens: { name: 'Synthetic-scene total tokens', unit: 'tokens' },
  },
  url: "https://4dcodebench.com/data/leaderboard.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  chart: {"title": "4DCodeBench score versus cost", "x": {"key": "cost", "label": "Mean cost per task", "unit": "$", "better": "lower", "log": true}, "y": {"key": "score", "label": "Overall score", "unit": "score", "better": "higher"}},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED); await new Promise(r=>setTimeout(r,1100)); const registry=await fetchJson<any>('https://4dcodebench.com/models.json');
      return d.models.map((r:any) => {
        const model = registry.models.find((m:any) => m.key === r.run);
        if (!model) throw new Error('Unknown model run ' + r.run);
        const metrics: Record<string,number> = {
          ...r.families, elo:r.elo, humanElo:r.human_elo, totalTokens:r.tokens, cost:r.cost_usd,
          steps:r.steps, rendered:r.rendered,
        };
        for (const split of ['real', 'synthetic']) {
          const stats = r.by_split?.[split];
          if (!stats) continue;
          metrics[split+'Elo'] = stats.elo;
          metrics[split+'HumanElo'] = stats.human_elo;
          metrics[split+'Vqa'] = stats.vqa;
          metrics[split+'Cost'] = stats.cost_usd;
          metrics[split+'TotalTokens'] = stats.tokens;
        }
        return {
          model:model.name, open:model.open, setting:model.effort || undefined, harness:r.harness,
          score:r.overall, cost:r.cost_usd, tokens:r.out_tokens,
          metrics:Object.fromEntries(Object.entries(metrics).filter(([,v]) => Number.isFinite(v))),
        };
      });
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
