// DeepFinance (Julius Research): 21 private equity and investment banking tasks with data rooms, graded on about
// 84 rubric criteria each. The launch post's charts carry each run in an aria-label: "Claude Opus 5.5 (max),
// Anthropic: 54.8% mean rubric score, 95% CI 46.2 to 64.4, $8.63 per task" on the score-vs-cost chart and
// "..., 10.5M tokens per task" on the score-vs-tokens chart. The score is the mean rubric score over 10 attempts
// per task. Tokens are all tokens of a task, not output tokens alone, so they go in metrics. Each lab's models ran
// in that lab's own agent harness, which becomes the row's harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.juliusresearch.ai/blog/deep-finance';

// the harness for each model family, from the post's Harness section (2026-11-05)
const HARNESS: [RegExp, string][] = [
  [/^Claude/, 'Claude Code 2.1.318'],
  [/^GPT/, 'Codex 0.166.0'],
  [/^Kimi/, 'Kimi Code 2.4.1'],
  [/^Qwen/, 'Qwen Code 0.26.6'],
  [/^Grok/, 'x.ai 1.0.70'],
  [/^Mistral/, 'Mistral Vibe 2.24.3'],
  [/^(?:Gemini|Muse|DeepSeek|GLM|Nemotron|Inkling)/, 'OpenCode 1.19.3'],
];

const unescape = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

const board: Leaderboard = {
  benchmark: 'deepfinance',
  url: 'https://www.juliusresearch.ai/',
  feed: `${PAGE} (chart aria-labels: mean rubric score, cost per task, tokens per task)`,
  terms: "juliusresearch.ai's robots.txt allows all paths, and the site has no terms page; scores are cited to Julius Research.",
  chart: {
    title: 'Score vs. tokens',
    note: 'Mean rubric score against all tokens a run used per task, on a log scale.',
    x: { key: 'tokensTotal', label: 'Tokens per task', better: 'lower', log: true },
    y: { key: 'score', label: 'Mean rubric score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((m) => unescape(m[1]));
    const RUN = /^(?:\d+\.\s+)?(.+?) \(([\w-]+)\), [^:]+: ([\d.]+)% mean rubric score, 95% CI ([\d.]+) to ([\d.]+)(?:, \$([\d.]+) per task|, ([\d.]+)([MK]) tokens per task)?$/;
    const runs = new Map<string, LeaderboardRow & { metrics: Record<string, number> }>();
    for (const l of labels) {
      const m = l.match(RUN);
      if (!m) continue;
      const [, model, effort, score, lo, hi, cost, tok, mult] = m;
      const id = `${model}|${effort}`;
      const row = runs.get(id) ?? { model, setting: effort, score: Number(score), date: '2026-11-05', harness: HARNESS.find(([re]) => re.test(model))?.[1], metrics: { ciLow: Number(lo), ciHigh: Number(hi) } };
      if (cost) row.cost = Number(cost);
      if (tok) row.metrics.tokensTotal = Number(tok) * (mult === 'M' ? 1e6 : 1e3);
      runs.set(id, row);
    }
    const rows = [...runs.values()];
    if (rows.length < 15) throw new Error(`DeepFinance: found ${rows.length} runs in the post`);
    return rows;
  },
};
export default board;
