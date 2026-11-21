// LatchBio Capabilities V0 aggregates agent performance across 13 biology benchmarks.
// The headline score is the equally weighted mean of the available benchmark percentages.
// This importer reads the published V0 CSV and keeps each observed benchmark as a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://benchmarks.bio/results/v0/';
const FEED = 'https://benchmarks.bio/results/v0/latest.csv';
const BENCHMARKS = ['spatialbench', 'spatialbench-long', 'scbench', 'scbench-long', 'epibench', 'variantbench', 'metagenomics', 'txbench-ab', 'txbench-pp', 'txbench-od', 'biosecbench-surveillance', 'functionbench', 'oncologybench'];
const PARTS = Object.fromEntries(BENCHMARKS.map((id) => [id, { name: id, group: 'Capability benchmark', unit: '%' }]));

const board: Leaderboard = {
  benchmark: 'latchbio-capabilities-v0',
  url: PAGE,
  feed: FEED,
  terms: 'LatchBio publishes this historical V0 results file on benchmarks.bio. Results are credited to LatchBio.',
  host: 'LatchBio',
  harnesses: 'system',
  parts: PARTS,
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length !== 46) throw new Error(`LatchBio Capabilities V0: ${rows.length} rows, expected 46`);
    return rows.map((row) => {
      const score = Number(row.overall_score_pct);
      if (!row.model || !row.harness || !Number.isFinite(score)) throw new Error('LatchBio Capabilities V0: incomplete row');
      const metrics: Record<string, number> = {};
      for (const id of BENCHMARKS) {
        const value = Number(row[id]);
        if (Number.isFinite(value)) metrics[id] = value;
      }
      return { model: row.model, harness: row.harness, submitter: row.provider, score, metrics };
    });
  },
};

export default board;
