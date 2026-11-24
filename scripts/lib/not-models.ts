// Rows a board lists beside its models that are not models: people, random or majority guessing, and oracles or
// bounds that see the answer. Pages compare models, so the sync leaves these rows out of every board (2026-11-24).
// The importer rule they follow is the score briefs' "Skip rows that are not models: humans, random or majority
// baselines, oracles". Named systems whose names only contain one of these words stay: Alpaca Farm PPO Human 7B,
// TrustLLMeu/baseline-7-8b, a Random Forest classifier, BM25, a contestant agent called "The Oracle".
//
// NOT_MODELS matches only whole names that mean the same thing on any board. A board whose own reference rows have
// other names (scripted bots, an oracle setting, "Do nothing") lists them in its importer's `notModels`.
import type { LeaderboardRow } from '../leaderboards/types.ts';

export const NOT_MODELS = new RegExp(
  [
    // people: "Human", "Humans", "MTurk Human", "Human Expert", "Human Agent", "SuperGLUE Human Baselines"
    String.raw`(?:(?:super)?glue )?(?:mturk )?humans?(?: experts?| baselines?| agent)?`,
    String.raw`human-baseline`,
    // guessing: "Random", "Uniform random", "Random guess (always B)", "Majority class", "Chance"
    String.raw`(?:uniform )?random(?: baseline| guess\b.*)?`,
    String.raw`majority(?: class)?`,
    String.raw`(?:random )?chance`,
    // MTEB's untrained reference encoder
    String.raw`mteb/baseline-random-encoder`,
  ].map((p) => `^(?:${p})$`).join('|'),
  'i',
);

/** True when a row's name is not a model: the shared list, or the board's own `notModels`. */
export function notModel(name: string, board?: RegExp): boolean {
  const n = name.replace(/\s+/g, ' ').trim();
  return NOT_MODELS.test(n) || !!board?.test(n);
}

/** The board's rows without the ones `notModel` names. */
export function withoutNonModels(rows: LeaderboardRow[], board?: RegExp): LeaderboardRow[] {
  return rows.filter((r) => !notModel(String(r.model ?? ''), board));
}
