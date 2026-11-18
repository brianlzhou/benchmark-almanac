// The almanac as it stood on a past day: which benchmarks and models were out, which scores were known, and who
// led. The time machine (pages/time-machine.astro) reads it, and so can anything that asks "what did we know then".
//
// The rules, in one place:
//   - A benchmark counts from the first day of its release month (a year alone counts from January 1). The
//     reign charts open a benchmark on the same day (reigns.ts), so the two agree.
//   - A model counts from its release day. A model with no release day never counts.
//   - A lab's own number counts from the day of its document (launch post, system card, technical report).
//   - A score from a leaderboard or Epoch AI counts from its model's release, and never before the benchmark opened.
//     That is how the sync dates them, so a model a board tested months later shows up early.
//   - From data/scores/first-seen.json's `since` day on, a board score we saw appear later than that counts from
//     the day we first saw it. Scores we had on `since`, scores that came with a board we just started reading,
//     and scores of a model we just added keep the release-day rule.
//   - Who led on a day comes from the site's reign rows (reigns.ts) from the source each benchmark's page leads
//     with today, so the time machine names the same leaders the benchmark pages and /leaders/ do. Reign rows use
//     the release-day rule only.
import firstSeenJson from '../../data/scores/first-seen.json';
import { benchById, benchmarks, models, cards, eciByModel, leaderboardScores, epochScores, viaBoardScores, cardScores, collectedClaims, bestPerModel } from './data.ts';
import { reignRow, originsOf, type Origin, type Source, type ReignRow } from './reigns.ts';
import type { Benchmark, Score } from './types.ts';

interface Ledger {
  since: string;
  updated: string;
  rows: [string, string, string | null, string | null, string][];
}
const ledger = firstSeenJson as unknown as Ledger;
/** The first day the scores file was in git: the earliest day a first-seen date can say anything. */
export const FIRST_SEEN_SINCE = ledger.since;

const key = (benchmark: string, entry: string, setting?: string | null, harness?: string | null) => `${benchmark}\t${entry}\t${setting ?? ''}\t${harness ?? ''}`;
const firstSeen = new Map(ledger.rows.filter((r) => r[4] > ledger.since).map((r) => [key(r[0], r[1], r[2], r[3]), r[4]]));

/** The day a benchmark opens: the first of its release month. Undefined when it has no release date. */
export function benchOpens(b: Pick<Benchmark, 'released'> | undefined): string | undefined {
  const r = b?.released;
  if (!r) return undefined;
  return r.length === 4 ? `${r}-01-01` : `${r.slice(0, 7)}-01`;
}

/** The day a score became known, by the rules at the top of this file. */
export function knownFrom(s: Score): string | null {
  if (s.source === 'card') return s.date ?? null;
  const opens = benchOpens(benchById.get(s.benchmark)) ?? '';
  let d = s.date ?? null;
  if (d && d < opens) d = opens;
  if (s.source === 'leaderboard') {
    const seen = firstSeen.get(key(s.benchmark, s.model || `~${s.name}`, s.setting, s.harness));
    if (seen && (!d || seen > d)) d = seen;
  }
  return d;
}

/** Benchmarks out by `day`: their release month has started. */
export const benchmarksBy = (day: string) => benchmarks.filter((b) => (benchOpens(b) ?? '9999') <= day);
/** Models out by `day`. */
export const modelsBy = (day: string) => models.filter((m) => m.released && m.released <= day);

/** Models out by `day` with an Epoch Capabilities Index score, highest first. The scores are today's. */
export function eciTop(day: string, n = 10): { model: string; eci: number }[] {
  return modelsBy(day)
    .filter((m) => eciByModel.has(m.id))
    .map((m) => ({ model: m.id, eci: eciByModel.get(m.id)!.eci }))
    .sort((a, b) => b.eci - a.eci || a.model.localeCompare(b.model))
    .slice(0, n);
}

/** Launch posts dated after `from` and up to `to`, newest first. */
export const launchPostsBetween = (from: string, to: string) => cards.filter((c) => c.date > from && c.date <= to).sort((a, b) => b.date.localeCompare(a.date));

// each source's scores by benchmark, as the reign rows group them
const by = (xs: Score[]) => {
  const m = new Map<string, Score[]>();
  for (const s of xs) (m.get(s.benchmark) ?? m.set(s.benchmark, []).get(s.benchmark)!).push(s);
  return m;
};
const scoresOf = new Map<Origin, Map<string, Score[]>>([
  ['leaderboard', by(leaderboardScores)],
  ['epoch', by(epochScores)],
  ['collected', by(viaBoardScores)],
  ['card', by(cardScores)],
  ['claim', by(collectedClaims)],
]);

/** The scores known on `day` for a benchmark from a source or pool, best per model, best first. */
export function boardOn(benchmark: string, day: string, source: Source = 'headline'): Score[] {
  const b = benchById.get(benchmark);
  if (!b) return [];
  const unit = b.unit ?? '%';
  const known = originsOf(benchmark, source).flatMap((o) => (scoresOf.get(o)!.get(benchmark) ?? []).filter((s) => s.unit === unit && (knownFrom(s) ?? '9999') <= day));
  return bestPerModel(known, b);
}

/**
 * Every score a benchmark's board can show from a source, each with the day it became known, so a page can work out
 * the board on any day itself (the time machine's watched benchmark). Scores in another unit are left out, as on
 * the board.
 */
export function historyOf(benchmark: string, source: Source = 'headline'): { score: Score; known: string }[] {
  const b = benchById.get(benchmark);
  if (!b) return [];
  const unit = b.unit ?? '%';
  return originsOf(benchmark, source).flatMap((o) =>
    (scoresOf.get(o)!.get(benchmark) ?? [])
      .filter((s) => s.model && s.unit === unit)
      .flatMap((s) => {
        const known = knownFrom(s);
        return known ? [{ score: s, known }] : [];
      }),
  );
}

/** Who held number one on `day`, from the site's reign row, with the best score so far and the day the lead began. */
export function leaderOn(row: ReignRow | null, day: string): { model: string; lab?: string; value: number; since: string; from?: Origin } | null {
  if (!row) return null;
  const g = row.reigns.filter((x) => x.start <= day).at(-1);
  if (!g) return null;
  const step = g.steps.filter((s) => s.date <= day).at(-1) ?? g.steps[0];
  return { model: g.model, lab: g.lab, value: step.value, since: g.start, from: step.from };
}

/** The leader of a benchmark on `day` from the source its page leads with. */
export const headlineLeaderOn = (benchmark: string, day: string) => leaderOn(reignRow(benchmark, 'headline'), day);

/** True when a benchmark had passed 85% by `day`, by the close-out its reign row records. */
export function closedBy(row: ReignRow | null, day: string): boolean {
  return !!row?.closedOut && row.closedOut.date <= day;
}
