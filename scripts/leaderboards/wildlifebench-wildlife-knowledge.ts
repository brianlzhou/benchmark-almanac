// WildlifeBench tests unaided species knowledge. Its JSON gives the equally weighted combined score, task breakdowns, confidence intervals and API usage.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://wildlifebench.org/data/wildlife-knowledge/results.json";
const board: Leaderboard = {
  benchmark: "wildlifebench-wildlife-knowledge",
  url: "https://wildlifebench.org/wildlife-knowledge/",
  feed: FEED,
  terms: "The disclaimer describes research and informational use. I found no explicit redistribution license for the scores or a leaderboard update date. https://wildlifebench.org/disclaimer/ The robots file allows this feed for the importer.",
  aliases: { 'OpenAI GPT-6.1 Sol': 'gpt-6-1-sol' },
  parts: {"task1": "Taxonomy", "task2": "Existence", "task3": "Red List", "task4": "Native range", "task5": "Introduced range", "task6": "Checklists", "task7": "Common names", "task8": "Authority", "task9": "Invasive species", "task10": "Nomenclature", "P2.fictitious_detected": "Invented names rejected", "P2.real_recognised": "Real names accepted", "P2.red_list_balanced": "Mean accuracy across categories", "P7.standard_name": "Standard English name", "P3.recorded_alien": "Recorded as alien, invasive or not"},
  chart: {
    title: 'Cost and performance',
    note: 'Combined score against reported API cost per question, matching the Cost and performance scatter chart on WildlifeBench.',
    x: { key: 'cost', label: 'Cost per question', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Combined score', unit: '%', better: 'higher' },
  },
  async fetch() {
    type Result = { value: number; low: number; high: number };
    type Entry = { display_name: string; open_weights: boolean; combined: Result; tasks: Record<string,Result>; parts: Record<string,Result>;
      cost_per_100_usd: number; mean_output_tokens: number };
    const d = await fetchJson<{ schema: string; models: Entry[] }>(FEED);
    if (d.schema !== 'wildlifebench.knowledge_evidence.v1' || d.models.length < 7) throw new Error('Missing Wildlife Knowledge V1 results');
    return d.models.map(m => {
      const metrics: Record<string, number> = {};
      for (const [key,result] of [...Object.entries(m.tasks).map(([id,r]) => ['task'+id,r] as const), ...Object.entries(m.parts)]) {
        metrics[key] = 100 * result.value; metrics[key+'Low'] = 100 * result.low; metrics[key+'High'] = 100 * result.high;
      }
      const { value,low,high } = m.combined;
      if (!m.display_name || ![value,low,high,...Object.values(metrics)].every(Number.isFinite) || Object.keys(board.parts!).some(k => !(k in metrics))) throw new Error('Invalid wildlife score');
      return { model: m.display_name, score: value*100, low: low*100, high: high*100, trials: 1, setting: 'Zero-shot, single pass',
        open: m.open_weights, cost: m.cost_per_100_usd / 100, tokens: m.mean_output_tokens, metrics };
    });
  },
};
export default board;
