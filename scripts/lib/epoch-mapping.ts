// Source-specific exceptions to Epoch metadata. Never merge a source model with a different checkpoint.
// These pure functions can be checked without downloading an export or writing any data files.
export type EpochModelOverride = { id: string } | { unmatched: string };

export function epochModelOverride(benchmark: string, version: string): EpochModelOverride | undefined {
  if (benchmark === 'Aider polyglot' && version === 'gemini-exp-1206') return { unmatched: version };
  if (benchmark === 'WeirdML' && version === 'gpt-5-chat') return { id: 'gpt-5-chat' };
  return undefined;
}

export function epochScoreColumn(benchmark: string, column: string): string {
  if (benchmark === 'METR Time Horizons') return 'Time horizon';
  if (benchmark === 'WeirdML v3') return 'Score';
  return column;
}

export function epochSecondaryMetrics(benchmark: string, row: Record<string, string>): Record<string, number> | null {
  if (benchmark !== 'WeirdML v3' || !row['Max performance']?.trim()) return null;
  const value = Number(row['Max performance']);
  // Epoch publishes both fields as fractions. Preserve final performance on the headline's percent scale.
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('WeirdML v3 Max performance is not a fraction');
  return { finalPerformance: value * 100 };
}

export function epochBenchmarkOverride(benchmark: string, notes: string): string | undefined {
  if (benchmark === 'ProofBench' && /\bProofBench\s+v1\.1\s+re[-\s]?grade\b/i.test(notes)) return 'proofbench-1-1';
  return undefined;
}
