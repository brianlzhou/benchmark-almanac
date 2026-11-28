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
  // Epoch ranks APEX-Agents by Pass@1, and Mercor's 1.1 board (where these rows come from) ranks by mean score
  if (benchmark === 'APEX-Agents') return 'Mean score';
  return column;
}

export function epochSecondaryMetrics(benchmark: string, row: Record<string, string>): Record<string, number> | null {
  if (benchmark === 'APEX-Agents') {
    const value = Number(row['Pass@1 score']);
    if (!row['Pass@1 score']?.trim()) return null;
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('APEX-Agents Pass@1 score is not a fraction');
    return { passAt1: Math.round(value * 1000) / 10 };
  }
  if (benchmark !== 'WeirdML v3' || !row['Max performance']?.trim()) return null;
  const value = Number(row['Max performance']);
  // Epoch publishes both fields as fractions. Preserve final performance on the headline's percent scale.
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error('WeirdML v3 Max performance is not a fraction');
  return { finalPerformance: value * 100 };
}

// Epoch benchmarks whose whole file holds one version that we keep as its own record, so the Epoch name, its
// metadata and every row belong on that record, not on the family's first version. Epoch's file is a copy of the
// maker's live board, so it follows the board when the maker ships a version: check it against the maker's
// versioned boards when one does. Checked 2026-11-24 by matching every row with our own import of each version:
//   - FrontierCode: Epoch's page is "FrontierCode 1.1". All 8 models on our 1.1 board match exactly, the 6 that
//     are also on 1.0 differ from it (Claude Sonnet 4.6: 24.31 against 15.07), and the newest row (Gemini 4 Argon,
//     2026-10-13) predates FrontierCode 2.0 (2026-10-27).
//   - CursorBench: Epoch's page still says 4.0, but its 53 rows equal Cursor's live chart, which Cursor's changelog
//     makes 4.1 since 2026-11-18, and include Gemini 4 Neon, first reported on 4.1. Epoch's export read on
//     2026-11-18 held the 4.0 numbers (94 rows, equal to our 4.0 board of 2026-11-17), and all 49 models in both
//     have since changed (GPT-5.6 Sol max: 41.7 to 40.9).
//   - PostTrainBench: Epoch's page says v1.1, the version it reviewed, but all 22 rows equal the site's results
//     version 1.2 (2026-09-30), which dropped BFCL and reweighted the rest (Claude Fable 5: 37.27 against 41.79 on 1.1).
//   - APEX-Agents: Epoch's page names no version and still describes the 480-task 1.0 set, and its file names no
//     source (checked 2026-11-25). But 69 of its 70 rows equal Mercor's 1.1 board on both Pass@1 and mean score
//     (Gemini 4 Carbon: 84.2 and 90.4), and none equals a 1.0 result (Gemini 3 Flash: 24.0 on 1.0).
const EPOCH_RECORD: Record<string, string> = {
  FrontierCode: 'frontiercode-1-1',
  CursorBench: 'cursorbench-4-1',
  PostTrainBench: 'posttrainbench-1-2',
  'APEX-Agents': 'apex-agents-1-1',
};

/** The record an Epoch benchmark's name, metadata and rows belong on, when it isn't the family's first version. */
export function epochRecord(benchmark: string): string | undefined {
  return EPOCH_RECORD[benchmark];
}

/**
 * A row of an Epoch file that mixes versions, placed on the version it ran. Checked 2026-11-24 against our own
 * import of each version:
 *   - ProofBench: a note marks the v1.1 regrade.
 *   - METR Time Horizons: Epoch's "METR version" column. Its 23 METR-Horizon-v1.1 rows equal METR's Time Horizon 1.1
 *     page. The v1.0 rows and the unmarked rows from METR's original paper and model reports stay on 1.0.
 *   - OSWorld 2.0: XLANG's 2026-08-08 patch release changed 45 of the 108 tasks. Epoch's rows for models released
 *     from July 2026 (GPT-5.6 Sol, Claude Opus 5) equal that release's board, and the 10 rows for earlier models
 *     equal the 2.0 board (Claude Opus 4.8 max: 20.6 on 2.0 against 37.65 on the patch), so the file has no other
 *     marker to split on.
 */
export function epochBenchmarkOverride(benchmark: string, row: Record<string, string>): string | undefined {
  if (benchmark === 'ProofBench' && /\bProofBench\s+v1\.1\s+re[-\s]?grade\b/i.test(row.Notes ?? '')) return 'proofbench-1-1';
  if (benchmark === 'METR Time Horizons' && (row['METR version'] ?? '').trim() === 'METR-Horizon-v1.1') return 'metr-time-horizon-1-1';
  if (benchmark === 'OSWorld 2.0' && (row['Release date'] ?? '') >= '2026-07-01') return 'osworld-2-0-2026-08-08';
  return undefined;
}
