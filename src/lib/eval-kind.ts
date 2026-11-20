// Two kinds of benchmark that counts, insights and the index builder treat apart: a lab's internal evaluation and a
// safety evaluation. Both read the benchmark's facets (src/lib/facets.ts) once it is tagged. Internal means a model
// developer's own test of its own models, with its own tasks ("Run by: a model developer", "Based on: its own
// tasks"). Safety means it measures a propensity or was built for a risk. Untagged benchmarks fall back to the older
// rules: private tasks, no public leaderboard and a lab we track among the makers, and the Safety area. A row for a
// benchmark carries `evalAttrs(b)`, which a reader settings menu, not on the site yet, will use to hide rows.
import { labs, LEADERBOARDS } from './data.ts';
import { areaOf } from './taxonomy.ts';
import { facetsOf, shown } from './facets.ts';
import type { Benchmark } from './types.ts';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// a lab's names as whole words, so "Meta" never matches "Metaculus"
const LAB_RE = new RegExp(`\\b(?:${[...new Set(labs.flatMap((l) => [l.name, ...((l as { aliases?: string[] }).aliases ?? [])]))].map(esc).join('|')})\\b`, 'i');

/** A lab's in-house evaluation: run by a model developer on its own models, as its facets say or the older rule guesses. */
export function isInternalEval(b: Pick<Benchmark, 'id' | 'access' | 'org' | 'links'>): boolean {
  const f = facetsOf(b.id);
  // a developer's own test of its own models: not its version of someone else's benchmark (GDPval v2) or its run of
  // someone else's method (an ECI fit), which readers can still compare with the original
  if (f?.runner) return f.runner === 'developer' && (!f.basis || f.basis === 'original');
  return b.access === 'private' && !LEADERBOARDS[b.id] && !b.links?.leaderboard && LAB_RE.test(b.org ?? '');
}

/** A safety evaluation: it measures a propensity or was built for a risk, or, untagged, it sits in the Safety area. */
export function isSafetyEval(b: Pick<Benchmark, 'id' | 'category'>): boolean {
  const f = facetsOf(b.id);
  if (f?.construct) return f.construct === 'propensity' || shown(f, 'risk').length > 0;
  return areaOf(b.category) === 'safety';
}

/**
 * A test of what models can do, for counts and indexes of capability: it measures capability and was not built for a
 * risk, or, untagged, it sits outside the Safety and Other areas.
 */
export function isCapabilityEval(b: Pick<Benchmark, 'id' | 'category'>): boolean {
  const f = facetsOf(b.id);
  if (f?.construct) return f.construct === 'capability' && !isSafetyEval(b) && areaOf(b.category) !== 'other';
  return !['safety', 'other'].includes(areaOf(b.category));
}

/** The attributes the settings menu will use to hide a benchmark's row: spread them onto the element. */
export function evalAttrs(b: Pick<Benchmark, 'id' | 'access' | 'org' | 'links' | 'category'>): Record<string, string> {
  return { ...(isInternalEval(b) ? { 'data-eval-internal': '' } : {}), ...(isSafetyEval(b) ? { 'data-eval-safety': '' } : {}) };
}
