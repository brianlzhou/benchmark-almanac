// ClawBench (TIGER-Lab and NAIL Group, live-website agent tasks). The TIGER-Lab/ClawBench Space reads
// leaderboard/results.csv from the TIGER-Lab/ClawBench dataset: one row per model, harness and corpus (v1,
// 153 tasks, or v2, 130 tasks), keeping the last row of each. It ranks by "Reward (lenient)", the share of
// runs whose final request matched the task and whose payload an LLM judge accepted (0 to 100), which is the
// score. The harness (hermes, openclaw) is kept, and avg_cost_per_task_usd is the cost when given. This file
// reads the v1 corpus. clawbench-v2.ts reads v2 through clawRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const CLAW_FEED = 'https://huggingface.co/datasets/TIGER-Lab/ClawBench/resolve/main/leaderboard/results.csv';
export const CLAW_URL = 'https://huggingface.co/spaces/TIGER-Lab/ClawBench';
export const CLAW_TERMS = 'CSV in the TIGER-Lab/ClawBench Hugging Face dataset, licensed Apache-2.0.';

/** The rows for one corpus ("v1" or "v2"), the last row of each model and harness winning, as the Space does. */
export async function clawRows(corpus: string): Promise<LeaderboardRow[]> {
  const last = new Map<string, LeaderboardRow>();
  for (const r of parseCsv(await fetchText(CLAW_FEED))) {
    const score = Number(r.reward_rate);
    if (r.dataset !== corpus || !r.model || r.reward_rate === '' || !Number.isFinite(score)) continue;
    const cost = Number(r.avg_cost_per_task_usd);
    // "z-ai/glm-4.5-air:free": an OpenRouter route and price tier, not part of the name
    const model = r.model.trim().replace(/:free$/, '');
    const stamp = model.match(/(20\d\d)-(\d\d)-(\d\d)$/);
    last.set(`${r.model}|${r.harness}`, {
      model,
      score,
      harness: r.harness || undefined,
      cost: r.avg_cost_per_task_usd && Number.isFinite(cost) ? cost : undefined,
      date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined,
    });
  }
  return [...last.values()];
}

const board: Leaderboard = {
  benchmark: 'clawbench',
  url: CLAW_URL,
  feed: `${CLAW_FEED} (dataset v1, reward_rate)`,
  terms: CLAW_TERMS,
  aliases: {},
  fetch: () => clawRows('v1'),
};
export default board;
