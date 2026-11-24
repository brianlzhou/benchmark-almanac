// Singularity-Bench (InfiniAI Lab, CMU): evaluates coding agents across six long-horizon tasks covering the full
// agent development lifecycle (pre-training, mid-training, post-training, inference engines, harness engineering, and
// cluster management). The headline Singularity-Index scales each task score relative to its human baseline (1.0).
// Reads the live assets/js/data.js bundle linked from the official leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://infini-ai-lab.github.io/singularity-bench/';

/** Parse the `A(...)` helper calls inside `const AGENTS = [...]` without eval. */
function parseAgents(js: string): LeaderboardRow[] {
  const start = js.indexOf('const AGENTS = [');
  if (start < 0) throw new Error('Singularity-Bench AGENTS array not found');
  const end = js.indexOf('];', start);
  if (end < 0) throw new Error('Singularity-Bench AGENTS terminator not found');
  const body = js.slice(start, end);
  const cols = ['pre', 'mid', 'post', 'inf', 'har', 'clu'] as const;
  const rows: LeaderboardRow[] = [];
  const callRe = /A\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*\[([^\]]*)\]\s*,\s*\[([^\]]*)\]/g;
  for (const m of body.matchAll(callRe)) {
    const [, model, harness, , , indexStr, totalStr, scoresRaw] = m;
    const score = Number(indexStr);
    const total = Number(totalStr);
    if (!Number.isFinite(score)) throw new Error(`Invalid Singularity-Index for ${model}`);
    const partsRaw = scoresRaw.split(',').map((s) => s.trim());
    if (partsRaw.length !== cols.length) throw new Error(`Unexpected task count for ${model}: ${partsRaw.length}`);
    const metrics: Record<string, number> = {};
    for (let i = 0; i < cols.length; i++) {
      const tok = partsRaw[i];
      if (tok === 'null' || tok === '') continue;
      const v = Number(tok.replace(/^'|'$/g, ''));
      if (Number.isFinite(v)) metrics[cols[i]] = v;
    }
    rows.push({
      model,
      harness,
      score,
      cost: Number.isFinite(total) ? total : undefined,
      metrics,
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'singularity-bench',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE}assets/js/data.js`,
  terms: 'Published openly by InfiniAI Lab on GitHub Pages with no robots.txt restrictions.',
  harnesses: 'system',
  costPer: 'run',
  parts: {
    pre: { name: 'Pre-training', group: 'Task', unit: 'score', better: 'lower', note: 'Validation perplexity of the LLM trained from scratch, where lower is better and the human baseline is 14.17.' },
    mid: { name: 'Mid-training', group: 'Task', unit: 'score', better: 'higher', note: 'Mean post-RL accuracy on AMC, HumanEval+, and GPQA-Diamond, where the human baseline is 0.175.' },
    post: { name: 'Post-training', group: 'Task', unit: 'score', better: 'higher', note: 'Mean resolve rate on held-out terminal tasks and SWE-bench Verified, where the human baseline is 0.539.' },
    inf: { name: 'Inference', group: 'Task', unit: 'usd', better: 'higher', note: 'Simulated FP8 serving income in USD per GPU-hour, where the SGLang baseline is 8.18.' },
    har: { name: 'Harness', group: 'Task', unit: 'score', better: 'higher', note: 'Mean downstream score on three kernel-generation and two vLLM bug-fixing tasks, where Claude Code scores 0.438.' },
    clu: { name: 'Cluster', group: 'Task', unit: 'score', better: 'higher', note: 'Combined request SLO attainment and model completion score, where NVIDIA Dynamo scores 0.460.' },
  },
  chart: {
    title: 'Performance vs. cost',
    note: 'Singularity-Index against total agent API spend across all six tasks, matching the Pareto chart on the Singularity-Bench site.',
    x: { key: 'cost', label: 'Total agent API cost (all six tasks)', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Singularity-Index', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const dataMatch = html.match(/src="(assets\/js\/data\.js[^"]*)"/);
    const dataUrl = dataMatch ? new URL(dataMatch[1], PAGE).href : `${PAGE}assets/js/data.js`;
    const js = await fetchText(dataUrl);
    const rows = parseAgents(js);
    if (rows.length < 8) throw new Error(`Singularity-Bench returned only ${rows.length} rows`);
    return rows;
  },
};
export default board;
