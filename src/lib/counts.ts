// One count convention for the whole site (decided 2026-11-04): every version counts. AIME 2024, 2025 and
// 2026 are three benchmarks. Tables still fold a family into one row under its newest version, so a row's count
// is its family's size.
import { benchmarks } from './data.ts';
import type { Benchmark } from './types.ts';

const newestOfFamily = new Map<string, string>();
// the same order familyOf() uses, so the last one seen is the newest
for (const b of [...benchmarks].sort((x, y) => (x.released ?? '').localeCompare(y.released ?? ''))) if (b.family) newestOfFamily.set(b.family, b.id);

/** True for a benchmark with no versions, or the newest version of one that has them. */
export const isNewest = (b: Benchmark) => !b.family || newestOfFamily.get(b.family) === b.id;

const familyCount = new Map<string, number>();
for (const b of benchmarks) if (b.family) familyCount.set(b.family, (familyCount.get(b.family) ?? 0) + 1);
/** How many records a benchmark's row stands for: itself and every other version in its family. */
export const familySize = (b: Benchmark) => (b.family ? (familyCount.get(b.family) ?? 1) : 1);

/** How many benchmarks we track, each version counted. */
export const benchmarkCount = benchmarks.length;
