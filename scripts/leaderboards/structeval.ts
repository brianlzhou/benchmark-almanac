// StructEval (TIGER-Lab). The project page reads static/data/leaderboard.json: one result per model with
// release date, judge, run notes and a metrics object whose "overall" (mean over all 2,035 examples, 0 to
// 100) is the ranking and the score. Only complete runs are read. The evaluation date is the row date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://tiger-ai-lab.github.io/StructEval/static/data/leaderboard.json';

interface Result {
  name: string;
  model_key?: string;
  complete?: boolean;
  evaluated_on?: string;
  access?: string;
  parameters_b?: number;
  active_parameters_b?: number;
  artifact_url?: string;
  n?: number;
  metrics?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'structeval',
  url: 'https://tiger-ai-lab.github.io/StructEval/',
  feed: `${FEED} (metrics.overall)`,
  terms: 'JSON file on the StructEval GitHub Pages site that the page loads; the page content is CC BY-SA 4.0.',
  stats: {
    renderRate: { name: 'Render score', unit: '%', better: 'higher', note: 'Percentage of generated outputs that load or render without syntax errors.' },
    paramsB: { name: 'Total parameters', unit: 'billions' },
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
  },
  chart: {
    title: 'Score vs. model size',
    note: 'Overall score against total parameter count in billions for models with disclosed sizes, matching the model size chart on StructEval.',
    x: { key: 'paramsB', label: 'Total parameters', unit: 'B', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall score', unit: '%', better: 'higher' },
  },
  parts: {
    renderable: {name: 'Renderable', group: 'Format'}, nonRenderable: {name: 'Non-renderable', group: 'Format'},
    tGeneration: {name: 'Text generation', group: 'Task'}, tConversion: {name: 'Text conversion', group: 'Task'},
    vGeneration: {name: 'Visual generation', group: 'Task'}, vConversion: {name: 'Visual conversion', group: 'Task'},
  },
  aliases: {
    // Preserve the three existing release-based matches when the run date differs or is unavailable.
    'GPT-4o': 'gpt-4o-may-2024',
    'Gemini 2.5 Flash-Lite': 'gemini-2-5-flash-lite-jun-2025',
    'Gemini 1.5 Pro': 'gemini-1-5-pro-feb-2024',
    'Qwen3 30B A3B Instruct 2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Gemma 4 26B A4B IT': 'gemma-4-26b-a4b',
    'Llama 3.1 8B Instruct': 'llama-3-1-8b',
    'Llama 3 8B Instruct': 'llama-3-8b',
  },
  async fetch() {
    const { results } = await fetchJson<{ results: Result[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of results) {
      const score = r.metrics?.overall;
      if (!r.name || r.complete === false || typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [name, value] of Object.entries(r.metrics ?? {})) {
        if (name !== 'overall' && Number.isFinite(value)) metrics[name.replace(/_(.)/g, (_, c: string) => c.toUpperCase())] = value;
      }
      if (typeof r.parameters_b === 'number' && r.parameters_b > 0) metrics.paramsB = r.parameters_b;
      if (typeof r.active_parameters_b === 'number') metrics.activeParamsB = r.active_parameters_b;
      rows.push({ model: r.name.trim(), score, date: r.evaluated_on, metrics,
        open: r.access === 'open' ? true : r.access === 'closed' ? false : undefined,
        params: r.parameters_b ?? undefined, link: r.artifact_url ? new URL(r.artifact_url, board.url).href : undefined,
      });
    }
    return rows;
  },
};
export default board;
