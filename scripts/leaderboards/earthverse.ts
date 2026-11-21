// EarthVerse tests scientific investigation of natural hazards. The official board ranks models by Mean core.
// Its models.json file publishes accuracy and rubric scores, difficulty and capability breakdowns, and average resource use.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://cuizhiq.github.io/EarthVerse/';
const feed = url + 'data/models.json';
const labels: Record<string, string> = {
  L2: 'L2', L3: 'L3', L4: 'L4', physical_mechanism: 'Physical mechanism', spatiotemporal_process: 'Spatiotemporal process',
  quantitative_calculation: 'Quantitative calculation', multi_source_evidence: 'Multi-source evidence', causal_chain: 'Causal chain',
  ranking_decision: 'Ranking decision', remote_sensing_geospatial: 'Remote sensing and geospatial',
};
type Entry = { name: string; metrics: Record<string, number>; process: Record<string, number>;
  difficulty: Record<string, number>; capabilities: Record<string, number>; available_result_count: number; eligible_result_count: number };
const board: Leaderboard = {
  benchmark: 'earthverse', url, feed,
  terms: 'The authors publish the scores at https://github.com/CuiZHIQ/EarthVerse without an explicit repository license.',
  costPer: 'run', reference: ['EarthVerse'], harnesses: 'system',
  parts: labels, aliases: { 'Nemotron Nano 9B V2': 'nvidia-nemotron-nano-9b-v2' },
  headline: 'Mean core averages answer correctness and the rubric score.',
  async fetch() {
    const data = await fetchJson<{ model_count: number; models: Entry[] }>(feed);
    if (data.models?.length !== data.model_count || data.model_count < 25) throw new Error('Incomplete EarthVerse leaderboard');
    const tables = paperTables(await paperHtml('https://arxiv.org/html/2608.23525')).map(grid);
    const costs = tables.find(t => t[0]?.join('|') === 'System|Core|Tokens/task (k)|Price (USD/M)|Cost (USD)');
    if (!costs) throw new Error('Missing EarthVerse cost table');
    const rows = data.models.map(entry => {
      const { mean_core: score, ...measures } = entry.metrics;
      const { avg_total_tokens: tokens, avg_rounds: steps, ...process } = entry.process;
      const parts = { ...entry.difficulty, ...entry.capabilities };
      for (const key of Object.keys(labels)) if (!Number.isFinite(parts[key])) throw new Error('Missing EarthVerse part: ' + key);
      if (![measures.answer_correctness, measures.llm_rubric, measures.strict_at_95, tokens, steps].every(Number.isFinite)) {
        throw new Error('Missing EarthVerse metrics');
      }
      const costRow = costs.slice(1).find(r => r[0] === entry.name && Number(r[1]) === score);
      const cost = costRow ? Number(costRow[4].replaceAll(',', '')) : undefined;
      const model = entry.name === 'GeoMMAgent' ? 'GPT-5.5' : entry.name;
      const harness = ['GeoMMAgent', 'OpenResearcher'].includes(entry.name) ? entry.name :
        entry.name === 'Claude Fable 5' ? 'Claude Code' : /^GPT-5\.6 (Luna|Sol|Terra)$/.test(entry.name) ? 'Codex' : 'EarthVerse';
      return { model, harness, score, cost, metrics: { ...measures, ...process, ...parts, steps, totalTokens: tokens,
        availableResults: entry.available_result_count, eligibleResults: entry.eligible_result_count } };
    });
    return checked(rows, data.model_count);
  },
};
export default board;
