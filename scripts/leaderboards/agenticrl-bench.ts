// AgenticRL-Bench (Kaggle Benchmarks, by eigent): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Pass rate" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'agenticrl-bench',
  url: 'https://www.kaggle.com/benchmarks/eigent/agenticrl-bench',
  feed: kaggleFeed('eigent', 'agenticrl-bench'),
  terms: KAGGLE_TERMS,
  parts: {
    verlUpgradeGate: 'Verl Upgrade Gate',
    inferenceRegimeNontransfer: 'Inference Regime Nontransfer',
    repoEnvAnswerLeakScrub: 'Repo Env Answer Leak Scrub',
    harborUpgradeRowParity: 'Harbor Upgrade Row Parity',
    stalePrefixRescueIncident: 'Stale Prefix Rescue Incident',
    sqlPartialCreditExploits: 'SQL Partial Credit Exploits',
    slimeTitoSession: 'Slime TITO Session',
    toolCallParseFidelity: 'Tool Call Parse Fidelity',
    scoreCenteringAgentRollouts: 'Score Centering Agent Rollouts',
    crossVocabTeacherScoring: 'Cross Vocab Teacher Scoring',
  },
  fetch: () => kaggleRowsWithBounds('eigent', 'agenticrl-bench', "Pass rate", 1, {
    verlUpgradeGate: { task: 'Verl Upgrade Gate' },
    inferenceRegimeNontransfer: { task: 'Inference Regime Nontransfer' },
    repoEnvAnswerLeakScrub: { task: 'Repo Env Answer Leak Scrub' },
    harborUpgradeRowParity: { task: 'Harbor Upgrade Row Parity' },
    stalePrefixRescueIncident: { task: 'Stale Prefix Rescue Incident' },
    sqlPartialCreditExploits: { task: 'SQL Partial Credit Exploits' },
    slimeTitoSession: { task: 'Slime TITO Session' },
    toolCallParseFidelity: { task: 'Tool Call Parse Fidelity' },
    scoreCenteringAgentRollouts: { task: 'Score Centering Agent Rollouts' },
    crossVocabTeacherScoring: { task: 'Cross Vocab Teacher Scoring' },
  }),
};
export default board;
