// LevelBench ranks accounting configurations by raw accuracy on 100 checks. The v4.1 deposit separates unassisted models, CLI agents and Level Playbooks.
// The version 4.1 table labels three-run consistency pass^3.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/datasets/LevelCFO/levelbench-100/resolve/324ad485c988ff9f3d05f7683f5d89743f4dd45b/leaderboard.json";
interface Entry { name: string; architecture_tier: string; zero_shot_raw_accuracy_pct: number; wall_time_seconds: number; estimated_cost_usd: number; [key: string]: unknown }

const board: Leaderboard = {
  benchmark: "levelbench-100-4-1",
  url: "https://huggingface.co/datasets/LevelCFO/levelbench-100/blob/324ad485c988ff9f3d05f7683f5d89743f4dd45b/leaderboard.json",
  feed: FEED,
  terms: "This snapshot separates unassisted models, CLI agents, and playbooks with human review. Level permits attributed citation. Commercial redistribution requires a written license. https://levelcfo.com/data/benchmarks/cases/LICENSE_AND_IP_NOTICE.txt Hugging Face allows crawling.",
  harnesses: 'system',
  parts: { area1_bookkeeping_pct: 'Bookkeeping', area2_accrual_close_pct: 'Accrual close', area3_cfo_analysis_pct: 'CFO analysis', area4_deliverables_pct: 'Deliverables' },
  async fetch() {
    const data = await fetchJson<Entry[]>(FEED);
    if (data.length < 38) throw new Error('Expected 38 Level configurations');
    return data.map(r => {
      const names = r.name.split(/ \+ | · /);
      const label = names.pop();
      const effort = label?.match(/ \(((?:High|Medium|Low)(?: Effort| Thinking)?)\)$/);
      const model = label?.replace(/ \((?:Prior Gen|Moonshot AI)\)$/, '').replace(effort?.[0] ?? /$^/, '');
      if (!model || !Number.isFinite(r.zero_shot_raw_accuracy_pct)) throw new Error('Incomplete Level result');
      const metrics: Record<string, number> = {};
      for (const [key,value] of Object.entries(r)) if (typeof value === 'number' && key !== 'zero_shot_raw_accuracy_pct') metrics[key === 'consistency_pass3_pct' ? 'pass3' : key === 'rank' ? 'publishedRank' : key] = value;
      metrics.latency = r.wall_time_seconds;
      return { model, setting: effort?.[1], harness: names.join(' + ') || undefined, score: r.zero_shot_raw_accuracy_pct, cost: r.estimated_cost_usd, metrics };
    });
  },
};
export default board;
