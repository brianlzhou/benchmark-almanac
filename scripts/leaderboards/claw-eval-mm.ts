// Claw-Eval multimodal tasks, the average score over three trials (multimodalModels avg_score × 100), read
// from the latest release through the helper in claw-eval.ts. Its extras add pass^3 (metrics.pass3), pass@3
// (passAt3) and the completion, robustness and safety means (0 to 100).
import type { Leaderboard } from './types.ts';
import { CLAW_ALIASES, CLAW_FEED, CLAW_SITE, CLAW_TERMS, clawRows } from './claw-eval.ts';

const board: Leaderboard = {
  benchmark: 'claw-eval-mm',
  url: `${CLAW_SITE}#/multimodal`,
  feed: `${CLAW_FEED} (multimodalModels avg_score)`,
  terms: CLAW_TERMS,
  aliases: CLAW_ALIASES,
  stats: { pass3: { name: 'Pass at 3', unit: '%', better: 'higher' }, passAt3: { name: 'Pass at 3 coverage', unit: '%', better: 'higher' }, completion: { name: 'Completion', unit: '%', better: 'higher' }, robustness: { name: 'Robustness', unit: '%', better: 'higher' }, safety: { name: 'Safety', unit: '%', better: 'higher' } },
  fetch: () => clawRows('multimodal', 'avg_score', 100, true),
};
export default board;
