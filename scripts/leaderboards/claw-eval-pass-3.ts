// Claw-Eval Pass^3 (a task counts only when all three trials pass), the board's default sort, read from the
// latest release through the helper in claw-eval.ts (benchmarkData pass_all_3_rate, already 0 to 100). Rows
// also carry the table's other columns in metrics, as claw-eval does: Pass^3 ("pass3", equal to the score),
// Pass@3 ("passAt3") and the parts completion, robustness and safety, in %.
import type { Leaderboard } from './types.ts';
import { CLAW_ALIASES, CLAW_FEED, CLAW_SITE, CLAW_TERMS, clawRows } from './claw-eval.ts';

const board: Leaderboard = {
  benchmark: 'claw-eval-pass-3',
  parts: {
    general_pass_all_3: { name: 'General', group: 'Task family' },
    multi_turn_pass_all_3: { name: 'Multi-turn', group: 'Task family' },
  },
  url: CLAW_SITE,
  feed: `${CLAW_FEED} (benchmarkData pass_all_3_rate)`,
  terms: CLAW_TERMS,
  aliases: CLAW_ALIASES,
  stats: {
    pass3: { name: 'Pass^3', unit: '%', better: 'higher' },
    passAt3: { name: 'Pass@3', unit: '%', better: 'higher' },
    pass_rate: { name: 'Pass rate', unit: '%', better: 'higher' },
    averageScore: { name: 'Average score', unit: '%', better: 'higher' },
    completion: { name: 'Completion', unit: '%', better: 'higher' },
    robustness: { name: 'Robustness', unit: '%', better: 'higher' },
    safety: { name: 'Safety', unit: '%', better: 'higher' },
    general_score: { name: 'General average score', unit: '%', better: 'higher' },
    general_pass_at_3: { name: 'General pass@3', unit: '%', better: 'higher' },
    general_completion: { name: 'General completion', unit: '%', better: 'higher' },
    general_robustness: { name: 'General robustness', unit: '%', better: 'higher' },
    general_safety: { name: 'General safety', unit: '%', better: 'higher' },
    multi_turn_score: { name: 'Multi-turn average score', unit: '%', better: 'higher' },
    multi_turn_pass_at_3: { name: 'Multi-turn pass@3', unit: '%', better: 'higher' },
    multi_turn_completion: { name: 'Multi-turn completion', unit: '%', better: 'higher' },
    multi_turn_robustness: { name: 'Multi-turn robustness', unit: '%', better: 'higher' },
    multi_turn_safety: { name: 'Multi-turn safety', unit: '%', better: 'higher' },
  },
  fetch: () => clawRows('general', 'pass_all_3_rate', 1, true, board),
};
export default board;
