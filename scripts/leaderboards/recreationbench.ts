// RecreationBench (Qwen, RecreationWorld). recreation-bench.cc renders its leaderboard in the browser from
// data/leaderboard.json: per model the reasoning effort, the estimated cost per task and, over the five
// platforms, the programmatic score (prog), the VLM judge score (vlm) and their mean (average, 0 to 1). The
// page ranks by that average, which is the score here (times 100). Effort is the setting and the estimated
// cost per task is kept. Each scored configuration retains its platform breakdown and token limits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://recreation-bench.cc/data/leaderboard.json';

interface Model {
  name: string;
  primary?: boolean;
  effort?: string;
  estimated_cost_usd_per_task?: number;
  context_window?: string;
  max_output_tokens?: string;
  variant?: string;
  scores?: Record<string, Record<string, number | null>>;
  overall?: Record<string, number | null>;
}

const board: Leaderboard = {
  benchmark: 'recreationbench',
  url: 'https://recreation-bench.cc/#leaderboard',
  feed: `${FEED} (overall.average)`,
  terms: 'JSON file the recreation-bench.cc page loads; the site publishes no robots.txt and no terms, and the results come from the RecreationWorld paper repository.',
  parts: { prog:'Programmatic', vlm:'VLM judge' },
  aliases: {},
  chart: {
    title: 'Cost and benchmark performance',
    note: 'The board compares its overall average score with estimated API cost per task, assuming 90% cache reads.',
    x: { key: 'cost', label: 'Mean cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Overall average score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { models, platforms } = await fetchJson<{ models: Model[], platforms: { id:string, name:string }[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const avg = m.overall?.average;
      if (!m.name || typeof avg !== 'number') continue;
      const metrics: Record<string, number> = {};
      const suffixes: Record<string,string> = { prog:'Prog', vlm:'Vlm', prog_ge90:'ProgGe90', prog_eq100:'ProgEq100' };
      for (const [column,suffix] of Object.entries(suffixes)) {
        const overall = m.overall?.[column];
        if (typeof overall === 'number') metrics[suffix[0].toLowerCase()+suffix.slice(1)] = overall*100;
        for (const p of platforms) {
          const value = m.scores?.[p.id]?.[column];
          if (typeof value === 'number') metrics[p.id+suffix]=value*100;
        }
      }
      for (const p of platforms) {
        const scores = m.scores?.[p.id];
        if (typeof scores?.prog !== 'number' || typeof scores.vlm !== 'number') continue;
        metrics[p.id] = (scores.prog + scores.vlm) * 50;
        board.parts![p.id] = {name:p.name,group:'Platform'};
      }
      for (const [key, label] of [['contextWindow',m.context_window],['maxOutputTokens',m.max_output_tokens]] as const) {
        const match = label?.match(/^([\d.]+)([km]?)$/i);
        if (match) metrics[key]=Number(match[1])*({k:1000,m:1000000}[match[2].toLowerCase()] ?? 1);
      }
      rows.push({ metrics,
        model: m.name.trim(),
        score: avg * 100,
        setting: [m.effort, m.variant].filter(Boolean).join('; ') || undefined,
        cost: m.estimated_cost_usd_per_task,
      });
    }
    return rows;
  },
};
export default board;
