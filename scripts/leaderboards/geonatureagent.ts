// GeoNatureAgent ranks nine models by capability accuracy across 93 tasks.
// Read the official headline table for the mean and one standard deviation across seeds, and the run file for usage and task categories.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/gabrielireland/GeoNatureAgent_Benchmark/raw/main/README.md";
const RUNS = "https://huggingface.co/datasets/gabrielireland/GeoNatureAgent_Benchmark/resolve/2e774399a696cd590f67cc473ab05b0cd267498c/results.jsonl";
const board: Leaderboard = {
  benchmark: "geonatureagent",
  url: "https://huggingface.co/datasets/gabrielireland/GeoNatureAgent_Benchmark#leaderboard",
  feed: FEED,
  terms: "The dataset card licenses tasks and per-run scores under CC BY 4.0. https://huggingface.co/datasets/gabrielireland/GeoNatureAgent_Benchmark Hugging Face robots.txt allows the dataset.",
  parts: { expansion: 'v6 expansion' },
  stats: {
    combined: { name: 'Combined score', unit: '%', better: 'higher' },
    expansionRaw: { name: 'Expansion raw score', unit: '%', better: 'higher' },
    latency: { name: 'Latency', unit: 'seconds', better: 'lower' },
    inputTokens: { name: 'Input tokens', unit: 'tokens', better: 'lower' },
    municipality: { name: 'Municipality score', unit: '%', better: 'higher' },
    memory: { name: 'Memory score', unit: '%', better: 'higher' },
    spatial_reasoning: { name: 'Spatial reasoning score', unit: '%', better: 'higher' },
    cross_indicator: { name: 'Cross-indicator score', unit: '%', better: 'higher' },
    error_handling: { name: 'Error handling score', unit: '%', better: 'higher' },
    ranking: { name: 'Ranking score', unit: '%', better: 'higher' },
    comparison: { name: 'Comparison score', unit: '%', better: 'higher' },
    deep_dive: { name: 'Deep dive score', unit: '%', better: 'higher' },
    interpretation: { name: 'Interpretation score', unit: '%', better: 'higher' },
    tool_selection: { name: 'Tool selection score', unit: '%', better: 'higher' },
    language: { name: 'Language score', unit: '%', better: 'higher' },
    single_analysis: { name: 'Single analysis score', unit: '%', better: 'higher' },
    habitat_analysis: { name: 'Habitat analysis score', unit: '%', better: 'higher' },
    multi_municipality_ranking: { name: 'Multi-municipality ranking score', unit: '%', better: 'higher' },
    province_aggregation: { name: 'Province aggregation score', unit: '%', better: 'higher' },
    error_recovery: { name: 'Error recovery score', unit: '%', better: 'higher' },
    threshold: { name: 'Threshold score', unit: '%', better: 'higher' },
    temporal_change: { name: 'Temporal change score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const head = tables.find(t => t[0].join('|') === '#|Model|Capability|Cost/case|Access');
    const combined = tables.find(t => t[0].includes('Combined capability'));
    const expansion = tables.find(t => t[0].join('|') === 'Model|Capability|Raw|Runs');
    if (!head || head.length < 10 || !combined || !expansion) throw new Error('Missing GeoNatureAgent results');
    await new Promise(resolve => setTimeout(resolve, 1000));
    type Run = { model_id: string; suite: string; category: string; seed: number; passed: boolean; output_tokens: number; input_tokens: number; duration_ms: number };
    const runs = (await fetchText(RUNS)).trim().split(/\r?\n/).map(line => JSON.parse(line) as Run);
    return head.slice(1).map(([, model, result, price, access]) => {
      const pair = result.match(/^([\d.]+)% ± ([\d.]+)/);
      const full = combined.slice(1).find(r => r[1] === model);
      const extra = expansion.slice(1).find(r => r[0] === model);
      const sample = runs.filter(r => r.suite === 'v5' && r.model_id === model);
      if (!pair || !full || !extra || sample.length < 186) throw new Error('Missing GeoNatureAgent data for ' + model);
      const avg = (get: (r: Run) => number) => sample.reduce((s,r) => s + get(r), 0) / sample.length;
      const score = Number(pair[1]), sd = Number(pair[2]);
      const metrics: Record<string, number> = { combined: parseFloat(full[2]), expansion: parseFloat(extra[1]), expansionRaw: parseFloat(extra[2]), latency: avg(r => r.duration_ms) / 1000, inputTokens: avg(r => r.input_tokens) };
      for (const category of new Set(sample.map(r => r.category))) {
        const cases = sample.filter(r => r.category === category);
        metrics[category] = 100 * cases.filter(r => r.passed).length / cases.length;
        board.parts![category] = { name: category, group: 'Task category' };
      }
      return { model, score, low: score - sd, high: score + sd, cost: Number(price.slice(1)), tokens: avg(r => r.output_tokens),
        trials: new Set(sample.map(r => r.seed)).size, setting: access, metrics };
    });
  },
};
export default board;
