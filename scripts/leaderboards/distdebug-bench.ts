// DistDebug-Bench (OrderLab, University of Michigan): evaluates coding agents on diagnosing 120 real distributed-system
// failure incidents from incomplete evidence. Reads the official JSON feed at distdebug.com/data/leaderboard.json.
// Headline 95% CI definition quoted verbatim from distdebug.com/leaderboard/: "Block coverage 95% CI" -> row.low / row.high.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://distdebug.com/leaderboard/';
const FEED = 'https://distdebug.com/data/leaderboard.json';

interface DistDebugPayload {
  generated?: string;
  rows: {
    model: string;
    harness: string;
    reasoning_effort?: string;
    attempts_per_bug?: number;
    values: {
      file_coverage: number;
      function_coverage: number;
      line_coverage: number;
      block_coverage: number;
      file_precision: number;
      function_precision: number;
      line_precision: number;
      block_precision: number;
      block_coverage_ci?: [number, number];
      flaky_rate: number;
      blocks_per_diagnosis: number;
      calls_per_run: number;
      tokens_per_run_k: number;
    };
    evidence?: Record<string, { block_coverage?: number }>;
  }[];
}

const board: Leaderboard = {
  benchmark: 'distdebug-bench',
  url: PAGE,
  feed: FEED,
  terms: 'Published openly on distdebug.com by OrderLab with no robots.txt restrictions.',
  harnesses: 'system',
  parts: {
    methodNoStack: { name: 'Method, no stack', group: 'Evidence group' },
    opaqueNoStack: { name: 'Opaque, no stack', group: 'Evidence group' },
    opaqueCrossComponent: { name: 'Opaque, cross-component', group: 'Evidence group' },
  },
  stats: {
    fileCoverage: { name: 'File coverage', unit: '%', better: 'higher' },
    funcCoverage: { name: 'Function coverage', unit: '%', better: 'higher' },
    lineCoverage: { name: 'Line coverage', unit: '%', better: 'higher' },
    filePrecision: { name: 'File precision', unit: '%', better: 'higher' },
    funcPrecision: { name: 'Function precision', unit: '%', better: 'higher' },
    linePrecision: { name: 'Line precision', unit: '%', better: 'higher' },
    blockPrecision: { name: 'Block precision', unit: '%', better: 'higher' },
    flakyRate: { name: 'Flaky bug rate', unit: '%', better: 'lower' },
    blocksPerDiagnosis: { name: 'Blocks per diagnosis', unit: 'count', better: 'lower' },
    callsPerRun: { name: 'Calls per run', unit: 'count', better: 'lower' },
    totalTokens: { name: 'Tokens per run', unit: 'tokens', better: 'lower' },
  },
  async fetch() {
    const data = JSON.parse(await fetchText(FEED)) as DistDebugPayload;
    const date = data.generated && /^\d{4}-\d{2}-\d{2}/.test(data.generated) ? data.generated.slice(0, 10) : undefined;
    const out: LeaderboardRow[] = data.rows.map((r) => {
      const v = r.values;
      if (!Number.isFinite(v.block_coverage)) throw new Error(`Invalid block_coverage for ${r.model}`);
      const metrics: Record<string, number> = {};
      const add = (k: string, val: number | null | undefined) => {
        if (typeof val === 'number' && Number.isFinite(val)) metrics[k] = val;
      };
      add('fileCoverage', v.file_coverage);
      add('funcCoverage', v.function_coverage);
      add('lineCoverage', v.line_coverage);
      add('filePrecision', v.file_precision);
      add('funcPrecision', v.function_precision);
      add('linePrecision', v.line_precision);
      add('blockPrecision', v.block_precision);
      add('flakyRate', v.flaky_rate);
      add('blocksPerDiagnosis', v.blocks_per_diagnosis);
      add('callsPerRun', v.calls_per_run);
      if (typeof v.tokens_per_run_k === 'number' && Number.isFinite(v.tokens_per_run_k)) {
        metrics.totalTokens = Math.round(v.tokens_per_run_k * 1000);
      }
      add('methodNoStack', r.evidence?.method_no_stack?.block_coverage);
      add('opaqueNoStack', r.evidence?.opaque_no_stack?.block_coverage);
      add('opaqueCrossComponent', r.evidence?.opaque_cross_component?.block_coverage);
      return {
        model: r.model,
        harness: r.harness,
        setting: r.reasoning_effort ? `${r.reasoning_effort} effort` : undefined,
        score: v.block_coverage,
        low: v.block_coverage_ci?.[0],
        high: v.block_coverage_ci?.[1],
        date,
        trials: r.attempts_per_bug,
        metrics,
      };
    });
    if (out.length < 10) throw new Error(`DistDebug-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
