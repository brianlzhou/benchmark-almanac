// CompMat-Bench results combining the authors' trajectories/manifest.json with arXiv:2610.00636 Tables 2 and 5.
// manifest.json provides exact per-attempt pass counts across full94, reduced52, repeat20x5, and workflow campaigns
// for all evaluated agents; arXiv Table 5 provides the 94-task category split (input preparation, output analysis,
// run and analyze) and Table 2 provides reported API costs in USD.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const REPO_URL = 'https://github.com/cz2014/CompMat-Bench';
const MANIFEST_FEED = 'https://raw.githubusercontent.com/cz2014/CompMat-Bench/HEAD/trajectories/manifest.json';
const PAPER_URL = 'https://arxiv.org/html/2610.00636';

interface ManifestRow {
  campaign: string;
  model: string;
  task_or_chain: string;
  score: number;
}

interface ManifestPayload {
  summary: {
    counts: Record<string, Record<string, number>>;
    passes: Record<string, Record<string, number>>;
  };
  rows: ManifestRow[];
}

const MODEL_META: Record<string, { model: string; harness: string }> = {
  codex_gpt_5_6: { model: 'gpt-5-6-sol', harness: 'Codex CLI' },
  gpt_5_6_sol: { model: 'gpt-5-6-sol', harness: 'MatClaw' },
  gemini_3_8_flash: { model: 'gemini-3-8-flash', harness: 'MatClaw' },
  deepseek_v4_1_flash: { model: 'deepseek-v4-1-flash', harness: 'MatClaw' },
  gpt_6_2_astra: { model: 'gpt-6-2-astra', harness: 'MatClaw' },
  gpt_6_1_sol: { model: 'gpt-6-1-sol', harness: 'MatClaw' },
  gemini_4_argon: { model: 'gemini-4-argon', harness: 'MatClaw' },
  gemini_4_carbon: { model: 'gemini-4-carbon', harness: 'MatClaw' },
  glm_5_3: { model: 'glm-5-3', harness: 'MatClaw' },
  qwen3_8_max: { model: 'qwen3-8-max', harness: 'MatClaw' },
};

const PAPER_NAME_TO_ID: Record<string, string> = {
  'DeepSeek V4.1 Flash|MatClaw': 'deepseek_v4_1_flash',
  'Gemini 3.8 Flash|MatClaw': 'gemini_3_8_flash',
  'GPT-5.6 Sol|MatClaw': 'gpt_5_6_sol',
  'GPT-5.6 Sol|Codex CLI': 'codex_gpt_5_6',
};

const pct = (passes: number, total: number, decimals: number) =>
  Number(((100 * passes) / total).toFixed(decimals));

const board: Leaderboard = {
  benchmark: 'compmat-bench',
  static: 'paper',
  url: REPO_URL,
  feed: MANIFEST_FEED,
  terms: 'CC BY 4.0, https://github.com/cz2014/CompMat-Bench/blob/HEAD/LICENSE',
  headline: 'Full-guidance pass rate across all 94 single-step computational materials science tasks from trajectories/manifest.json.',
  parts: {
    inputs: { name: 'Prepare inputs' },
    outputs: { name: 'Analyze outputs' },
    run: { name: 'Run and analyze' },
    reduced52: { name: 'Reduced guidance (52 tasks)' },
    repeat20x5: { name: 'Repeated trials (20 tasks)' },
    workflow: { name: 'Workflows' },
  },
  stats: {
    passes: { name: 'Tasks passed', unit: 'count', better: 'higher' },
    totalCost: { name: 'API cost', unit: 'usd', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [manifest, html] = await Promise.all([
      fetchJson<ManifestPayload>(MANIFEST_FEED),
      paperHtml(PAPER_URL),
    ]);

    const tables = paperTables(html).map(grid);
    const taskTable = tables.find((t) => t[0]?.[0] === 'Task' && t[0]?.[3] === 'Kind');
    const costTable = tables.find((t) => t.some((r) => r[0] === 'Model' && r[1] === 'Harness' && r[6] === '(USD)'));
    if (!taskTable) throw new Error('CompMat-Bench task-kind table missing from arXiv HTML');

    // Map short task prefix (e.g. "202509_001") -> inputs / outputs / run
    const kindByPrefix = new Map<string, 'inputs' | 'outputs' | 'run'>();
    for (const r of taskTable.slice(1)) {
      const code = r[0]?.trim();
      const kind = r[3]?.trim().toLowerCase();
      if (!code || !kind) continue;
      if (kind.includes('input')) kindByPrefix.set(code, 'inputs');
      else if (kind.includes('output')) kindByPrefix.set(code, 'outputs');
      else if (kind.includes('run')) kindByPrefix.set(code, 'run');
    }

    // Extract reported total API costs from Table 2
    const costById = new Map<string, number>();
    if (costTable) {
      for (const r of costTable) {
        const id = PAPER_NAME_TO_ID[`${r[0]?.trim()}|${r[1]?.trim()}`];
        const usd = Number(r[6]);
        if (id && Number.isFinite(usd) && usd > 0) costById.set(id, usd);
      }
    }

    // Aggregate per-category full94 scores from manifest.rows
    const catStats = new Map<string, Record<'inputs' | 'outputs' | 'run', { pass: number; total: number }>>();
    for (const r of manifest.rows) {
      if (r.campaign !== 'full94') continue;
      const m = r.task_or_chain.match(/^task_(\d+_\d+)_/);
      const kind = m ? kindByPrefix.get(m[1]) : undefined;
      if (!kind) continue;
      let bucket = catStats.get(r.model);
      if (!bucket) {
        bucket = { inputs: { pass: 0, total: 0 }, outputs: { pass: 0, total: 0 }, run: { pass: 0, total: 0 } };
        catStats.set(r.model, bucket);
      }
      bucket[kind].total++;
      if (r.score >= 1) bucket[kind].pass++;
    }

    const counts = manifest.summary.counts;
    const passes = manifest.summary.passes;
    const rows: LeaderboardRow[] = [];

    for (const [id, total] of Object.entries(counts.full94 ?? {})) {
      const passed = passes.full94?.[id];
      if (typeof passed !== 'number' || !(total > 0)) continue;
      const meta = MODEL_META[id] ?? { model: id.replace(/_/g, '-'), harness: 'MatClaw' };
      const metrics: Record<string, number> = { passes: passed };

      const cats = catStats.get(id);
      if (cats) {
        if (cats.inputs.total > 0) metrics.inputs = pct(cats.inputs.pass, cats.inputs.total, 1);
        if (cats.outputs.total > 0) metrics.outputs = pct(cats.outputs.pass, cats.outputs.total, 1);
        if (cats.run.total > 0) metrics.run = pct(cats.run.pass, cats.run.total, 1);
      }

      const redCount = counts.reduced52?.[id];
      const redPass = passes.reduced52?.[id];
      if (redCount && typeof redPass === 'number') metrics.reduced52 = pct(redPass, redCount, 3);

      const repCount = counts.repeat20x5?.[id];
      const repPass = passes.repeat20x5?.[id];
      if (repCount && typeof repPass === 'number') metrics.repeat20x5 = pct(repPass, repCount, 3);

      const wfCount = counts.workflow?.[id];
      const wfPass = passes.workflow?.[id];
      if (wfCount && typeof wfPass === 'number') metrics.workflow = pct(wfPass, wfCount, 3);

      const totalCost = costById.get(id);
      let cost: number | undefined;
      if (totalCost !== undefined) {
        metrics.totalCost = totalCost;
        cost = Number((totalCost / total).toPrecision(4));
      }

      rows.push({
        model: meta.model,
        setting: 'Full guidance',
        harness: meta.harness,
        score: pct(passed, total, 2),
        trials: 1,
        ...(cost !== undefined ? { cost } : {}),
        metrics,
      });
    }

    if (rows.length < 4) {
      throw new Error(`Expected at least 4 rows from CompMat-Bench manifest, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
