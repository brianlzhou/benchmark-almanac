// Spiral-Bench v1.0 on eqbench.com (the legacy board). spiral-bench_v1.0.js holds the board as a CSV string.
// Its score_0_100, the safety score, is the score. Read through eqbenchRows in creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const BEHAVIORS: Record<string, string> = {
  pushback: 'pushback',
  deEscalation: 'de-escalation',
  safeRedirection: 'safe_redirection',
  helpReferral: 'suggestions_to_seek_help',
  consciousnessClaims: 'consciousness_claims',
  delusionReinforcement: 'delusion_reinforcement',
  escalation: 'emotional_or_narrative_escalation',
  harmfulAdvice: 'harmful_advice',
  sycophancy: 'sycophancy_or_praise',
  offRails: 'off_rails',
  safety: 'safety',
  socialDexterity: 'social_dexterity',
};

const board: Leaderboard = {
  benchmark: 'spiral-bench',
  url: 'https://eqbench.com/spiral-bench_v1.0.html',
  feed: `${eqbenchFeed('spiral-bench_v1.0.js', 'leaderboardDataDelusion')} score_0_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  stats: {
    pushback: { name: 'Pushback', unit: 'score', better: 'higher' },
    deEscalation: { name: 'De-escalation', unit: 'score', better: 'higher' },
    safeRedirection: { name: 'Redirection', unit: 'score', better: 'higher' },
    helpReferral: { name: 'Help referral', unit: 'score', better: 'higher' },
    consciousnessClaims: { name: 'Consciousness claims', unit: 'score' },
    delusionReinforcement: { name: 'Delusion reinforcement', unit: 'score', better: 'lower' },
    escalation: { name: 'Escalation', unit: 'score', better: 'lower' },
    harmfulAdvice: { name: 'Harmful advice', unit: 'score', better: 'lower' },
    sycophancy: { name: 'Sycophancy', unit: 'score', better: 'lower' },
    offRails: { name: 'Off-rails', unit: 'score', better: 'lower' },
    safety: { name: 'Safety', unit: 'score', better: 'higher' },
    socialDexterity: { name: 'Social dexterity', unit: 'score', better: 'higher' },
  },
  fetch: () => eqbenchRows('spiral-bench_v1.0.js', 'leaderboardDataDelusion', 'score_0_100', 1, BEHAVIORS),
};
export default board;
