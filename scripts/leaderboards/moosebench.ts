// MooseBench reports mean input-file similarity over 220 cases. The paper's aggregate tables include method settings, confidence intervals and mixed-model experiments.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Run { model?: string; extractor?: string; generator?: string; method: string; n: number; mean_ifs: number; ci95_half_width?: number; parse_rate?: number; exec_rate?: number; good_exec?: number; false_exec?: number; error_count?: number }

const feed = "https://raw.githubusercontent.com/HaningZS/moose-ifs/0592e1134fce7e3577c85e99e62c674acccc4cfd/results/derived/main_tables.json";
const board: Leaderboard = {
  benchmark: 'moosebench',
  stats: { exec_rate: { name: 'Execution rate', unit: 'score', better: 'higher', note: 'Execution rate is stored from 0 to 1.' }, good_exec: { name: 'Good execution rate', unit: 'score', better: 'higher', note: 'Good execution rate is stored from 0 to 1.' }, false_exec: { name: 'False execution rate', unit: 'score', better: 'lower', note: 'False execution rate is stored from 0 to 1.' }, parse_rate: { name: 'Parse rate', unit: 'score', better: 'higher', note: 'Parse rate is stored from 0 to 1.' }, error_count: { name: 'Errors', unit: 'count', better: 'lower' } },
  url: "https://github.com/HaningZS/moose-ifs/blob/main/results/derived/main_tables.json",
  feed,
  terms: "GitHub requests a one-second crawl delay and the raw host has no robots file. The repository uses the MIT License. The authors request citation of the source paper for dataset use. https://github.com/HaningZS/moose-ifs/blob/main/LICENSE",
  async fetch() {
    const data = await fetchJson<Record<string, Run[]>>(feed);
    const rows = [];
    const seen = new Set<string>();
    for (const [table, minimum] of Object.entries({ ordinary_220_case_sweeps: 9, deployment_audit_220_case: 6, official_document_access_control: 3, weak_model_registry_stress: 6, mixed_model_ablation: 8 })) {
      if (data[table]?.length < minimum || !data[table]) throw new Error('Missing MooseBench table ' + table);
      for (const r of data[table]) {
        const key = JSON.stringify(r);
        if (seen.has(key)) continue;
        seen.add(key);
        const model = r.model || r.generator;
        if (!model || !r.method || !r.n || !Number.isFinite(r.mean_ifs)) throw new Error('Incomplete MooseBench result');
        const metrics: Record<string, number> = {};
        for (const k of ['parse_rate','exec_rate','good_exec','false_exec','error_count'] as const) if (r[k] != null) metrics[k] = r[k];
        const ci = r.ci95_half_width;
        rows.push({ model, models: r.extractor && r.extractor !== model ? [model, r.extractor] : undefined,
          setting: r.extractor ? r.method + ', extractor: ' + r.extractor : r.method, score: r.mean_ifs, trials: r.n, metrics,
          low: ci == null ? undefined : r.mean_ifs - ci, high: ci == null ? undefined : r.mean_ifs + ci });
      }
    }
    return rows;
  },
};
export default board;
