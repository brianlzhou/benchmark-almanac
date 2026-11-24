// CircuitRubric grades analog designs on 125 circuits. FULL is the percentage with correct topology and sizing.
// The authors' results CSV records each run, including prompts, decoding settings, latency and token totals.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/levantlabs/circuitrubric-bench/main/docs/results/all_results.csv";

const board: Leaderboard = {
  benchmark: "circuitrubric",
  url: "https://github.com/levantlabs/circuitrubric-bench/blob/main/docs/results/leaderboard.md",
  feed,
  terms: "The maker licenses the code under Apache 2.0 and the fixtures under CC BY 4.0. The README gives no separate results license. The host has no robots.txt.",
  stats: { decorated: { name: 'Decorated circuits', unit: 'count' }, empty: { name: 'Empty circuits', unit: 'count' }, full: { name: 'Fully correct circuits', unit: 'count' }, full_emitted_pct: { name: 'Full emitted percentage', unit: '%' }, full_ign_src_pct: { name: 'Full ignored-source percentage', unit: '%' }, functional_full_pct: { name: 'Functional full percentage', unit: '%' }, in_tokens: { name: 'Input tokens', unit: 'tokens' }, malformed_term: { name: 'Malformed term count', unit: 'count' }, mean_latency_s: { name: 'Mean latency', unit: 'seconds', better: 'lower' }, none: { name: 'No-score circuits', unit: 'count' }, out_tok_per_s: { name: 'Output token throughput', unit: 'tokens/s', better: 'higher' }, partial: { name: 'Partially correct circuits', unit: 'count' }, partial_bulk: { name: 'Partially correct bulk circuits', unit: 'count' }, recognized_pct: { name: 'Recognized percentage', unit: '%' }, sourceDrainEquivPct: { name: 'Source-drain equivalent percentage', unit: '%', better: 'higher' }, topo_ok_pct: { name: 'Topology-correct percentage', unit: '%' }, topology: { name: 'Topology-correct circuits', unit: 'count' }, xfail: { name: 'Expected failures', unit: 'count' } },
  async fetch() {
    const runs = parseCsv(await fetchText(feed));
    const required = ['id', 'model', 'backend', 'fixture_prompt', 'system_prompt', 'effort', 'reasoning', 'temperature', 'max_tokens', 'n', 'full_pct', 'mean_latency_s', 'out_tokens'];
    if (runs.length < 246 || required.some(k => !(k in runs[0]))) throw new Error('Incomplete CircuitRubric results');
    return runs.map(r => {
      const score = Number(r.full_pct), count = Number(r.n);
      if (!r.model || !r.full_pct || !Number.isFinite(score) || count !== 125) throw new Error('Unexpected CircuitRubric run');
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries(r)) {
        if (!value.trim() || !Number.isFinite(Number(value))) continue;
        if (['full_pct', 'out_tokens', 'temperature', 'max_tokens', 'n'].includes(key)) continue;
        metrics[key === 'sd_equiv_pct' ? 'sourceDrainEquivPct' : key] = Number(value);
      }
      const setting = [r.fixture_prompt, r.system_prompt, r.effort, r.reasoning, 'run ' + r.id].filter(Boolean).join(', ');
      return { model: r.model, score, setting, harness: r.backend, metrics, tokens: r.out_tokens ? Number(r.out_tokens) / count : undefined };
    });
  },
};
export default board;
