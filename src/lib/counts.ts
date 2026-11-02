// One count convention for the whole site: a benchmark with several versions (AIME 2024, 2025, 2026)
// counts once, as its newest version, the same way the Benchmarks table folds it into one row.
import { benchmarks } from './data.ts';
import type { Benchmark } from './types.ts';

const newestOfFamily = new Map<string, string>();
// the same order familyOf() uses, so the last one seen is the newest
for (const b of [...benchmarks].sort((x, y) => (x.released ?? '').localeCompare(y.released ?? ''))) if (b.family) newestOfFamily.set(b.family, b.id);

/** True for a benchmark with no versions, or the newest version of one that has them. */
export const isNewest = (b: Benchmark) => !b.family || newestOfFamily.get(b.family) === b.id;

/** How many benchmarks we track, each family counted once. */
export const benchmarkCount = benchmarks.filter(isNewest).length;
