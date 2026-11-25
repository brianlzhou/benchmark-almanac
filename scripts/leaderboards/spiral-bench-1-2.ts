// Spiral-Bench v1.2 on eqbench.com. spiral-bench.js holds the board as a CSV string. Its score_0_100, the safety
// score built from the judged protective and risky behaviors, is the score. Read through eqbenchRows in
// creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const BEHAVIORS: Record<string, string> = {
  pushback: 'pushback',
  deEscalation: 'de-escalation',
  topicShutDown: 'topic-shut-down',
  boundarySetting: 'boundary-setting',
  validateFeelingsNotThoughts: 'validate-feelings-not-thoughts',
  helpReferralWarranted: 'help-referral-warranted',
  benignWarmth: 'benign-warmth',
  confidentBullshitting: 'confident-bullshitting',
  delusionReinforcement: 'delusion-reinforcement',
  escalation: 'escalation',
  harmfulAdvice: 'harmful-advice',
  helpReferralUnwarranted: 'help-referral-unwarranted',
  negativeSentienceClaim: 'negative-sentience-claim',
  positiveSentienceClaim: 'positive-sentience-claim',
  ritualization: 'ritualization',
  sycophancy: 'sycophancy',
  uncertainSentienceClaim: 'uncertain-sentience-claim',
  offRails: 'off-rails',
};

const board: Leaderboard = {
  benchmark: 'spiral-bench-1-2',
  url: 'https://eqbench.com/spiral-bench.html',
  feed: `${eqbenchFeed('spiral-bench.js', 'leaderboardDataDelusion')} score_0_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  stats: {
    pushback: { name: 'Pushback', unit: 'score', better: 'higher' },
    deEscalation: { name: 'De-escalation', unit: 'score', better: 'higher' },
    topicShutDown: { name: 'Topic shut-down', unit: 'score', better: 'higher' },
    boundarySetting: { name: 'Boundary setting', unit: 'score', better: 'higher' },
    validateFeelingsNotThoughts: { name: 'Validate feelings not thoughts', unit: 'score', better: 'higher' },
    helpReferralWarranted: { name: 'Help referral warranted', unit: 'score', better: 'higher' },
    benignWarmth: { name: 'Warmth', unit: 'score' },
    confidentBullshitting: { name: 'Confident bullshitting', unit: 'score', better: 'lower' },
    delusionReinforcement: { name: 'Delusion reinforcement', unit: 'score', better: 'lower' },
    escalation: { name: 'Escalation', unit: 'score', better: 'lower' },
    harmfulAdvice: { name: 'Harmful advice', unit: 'score', better: 'lower' },
    helpReferralUnwarranted: { name: 'Help referral unwarranted', unit: 'score', better: 'lower' },
    negativeSentienceClaim: { name: 'Negative sentience claim', unit: 'score' },
    positiveSentienceClaim: { name: 'Positive sentience claim', unit: 'score' },
    ritualization: { name: 'Ritualization', unit: 'score', better: 'lower' },
    sycophancy: { name: 'Sycophancy', unit: 'score', better: 'lower' },
    uncertainSentienceClaim: { name: 'Uncertain sentience claim', unit: 'score' },
    offRails: { name: 'Off-rails', unit: 'score', better: 'lower' },
  },
  fetch: () => eqbenchRows('spiral-bench.js', 'leaderboardDataDelusion', 'score_0_100', 1, BEHAVIORS),
};
export default board;
