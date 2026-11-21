// IlùBench measures how often an Igbo prompt receives an Igbo reply.
// The public API separates current complete probe sets from earlier runs and from human cultural ratings.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://uuamni-uche-production.up.railway.app/api/public/ilubench-leaderboard";
interface Entry {
  runs: number; last_run_at: string;
  arm_b_output_language: {scored_n: number; shares: Record<string,number>};
  register_delta: {shares: Record<string,number>; provenance: Record<string,number>};
  cultural_correctness: {scored_n: number; pending_n: number; arm_a: {mean: number | null}; arm_b: {mean: number | null}};
}

const board: Leaderboard = {
  benchmark: "ilubench",
  url: "https://uche.uuamni.com/ilubench",
  feed,
  terms: "The dataset card specifies CC BY 4.0. The live feed reports rubric versions and scoring provenance. Current model rows lack paired cultural correctness scores. https://huggingface.co/datasets/UUAMNI/ilubench Neither host publishes crawler restrictions at robots.txt.",
  async fetch() {
    const d = await fetchJson<{models: Record<string,Entry>; rule_version: number}>(feed);
    const rows = Object.entries(d.models).map(([model, r]) => {
      const lang = r.arm_b_output_language;
      if (!lang.scored_n || !Object.keys(lang.shares).length || Object.values(lang.shares).some(v => !Number.isFinite(v) || v < 0 || v > 1)) throw new Error('Missing language scores for ' + model);
      const metrics: Record<string,number> = { scored: lang.scored_n, humanScored: r.cultural_correctness.scored_n, pending: r.cultural_correctness.pending_n };
      for (const [k,v] of Object.entries(r.register_delta.shares)) metrics['register_' + k] = 100*v;
      for (const [k,v] of Object.entries(r.register_delta.provenance)) metrics['registerScored_' + k] = v;
      if (r.cultural_correctness.arm_a.mean != null) metrics.culturalEnglish = r.cultural_correctness.arm_a.mean;
      if (r.cultural_correctness.arm_b.mean != null) metrics.culturalIgbo = r.cultural_correctness.arm_b.mean;
      return { model, score: 100*(lang.shares.ig ?? 0), date: r.last_run_at, setting: 'API · rubric v' + d.rule_version, metrics };
    });
    if (rows.length < 5) throw new Error('Expected five current IlùBench models');
    return rows;
  },
};
export default board;
