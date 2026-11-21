// Envisioning scores models on their ability to identify signals of change. Its November snapshot supplies
// the overall composite, its four components and the composite for each industry brief.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://signals.envisioning.com/benchmark/2026-11-03.json";
type Entry = { model: string; overall: Record<string, number>; per_brief: Record<string, { composite: number } | null> };

const board: Leaderboard = {
  benchmark: "envisioning-signals-benchmark",
  url: "https://signals.envisioning.com/benchmark",
  feed,
  terms: "Envisioning licenses its repository under MIT. The leaderboard does not specify separate terms for its hosted score file. robots.txt allows the feed path.",
  parts: {"healthcare-regulated-ai": "AI in regulated healthcare", "fintech-stablecoin-rails": "Stablecoin payment rails", "energy-grid-electrification": "Grid + electrification", "geopolitics-tech-blocs": "Tech-bloc formation", "ai-infrastructure-scaling": "AI infrastructure scaling", "retail-genai-commerce": "GenAI-native commerce"},
  async fetch() {
    const { scores } = await fetchJson<{ scores: Entry[] }>(feed);
    if (scores.length < 47) throw new Error('Incomplete Envisioning leaderboard');
    return scores.map(r => {
      const { composite, ...metrics } = r.overall;
      if (!r.model || !Number.isFinite(composite) || !['currency','specificity','coverage','verifiability'].every(k => Number.isFinite(metrics[k])))
        throw new Error('Missing overall signal score');
      for (const [brief, result] of Object.entries(r.per_brief)) {
        if (result == null) continue;
        if (!Number.isFinite(result.composite)) throw new Error('Missing composite for ' + brief);
        metrics[brief] = result.composite;
      }
      return { model: r.model, score: composite, metrics };
    });
  },
};
export default board;
