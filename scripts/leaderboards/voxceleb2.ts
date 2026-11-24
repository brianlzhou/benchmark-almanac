// VoxCeleb2 tests whether two recordings contain the same speaker.
// Stanford's AHELM leaderboard reports the fraction of exact matches.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';
import corebench from './corebench-conversational-reasoning.ts';

const table: HelmTable = { project: 'audio', kind: 'runs', group: 'voxceleb2', column: 'EM', scale: 100 };
const board: Leaderboard = {
  benchmark: 'voxceleb2', host: 'AHELM', url: 'https://crfm.stanford.edu/helm/audio/latest/#/groups/voxceleb2',
  feed: helmFeed(table), aliases: corebench.aliases,
  terms: 'Stanford publishes HELM under Apache 2.0. https://github.com/stanford-crfm/helm/blob/main/LICENSE',
  stats: {
    truncated: { name: 'Truncated fraction', unit: 'score', better: 'lower', note: 'Fraction of inputs truncated before evaluation, from 0 to 1.' },
    '# prompt tokens': { name: 'Prompt tokens', unit: 'tokens' },
    '# output tokens': { name: 'Generated tokens', unit: 'tokens' },
    inputTokens: { name: 'Input tokens', unit: 'tokens' },
    outputTokens: { name: 'Output tokens', unit: 'tokens' },
  },
  async fetch() {
    const rows = await helmRows(table, true);
    for (const row of rows) {
      const blend = /^(whisper-1|gpt-4o(?:-mini)?-transcribe)_(gpt-4o-2024-11-20)$/.exec(row.model);
      if (blend) {
        row.model = blend[2];
        row.models = [blend[2], blend[1]];
        row.harness = blend[1] + ' transcription';
      }
      if (row.metrics && '# prompt tokens' in row.metrics) row.metrics.inputTokens = row.metrics['# prompt tokens'];
      if (row.metrics && row.tokens !== undefined) row.metrics.outputTokens = row.tokens;
      delete row.date;
    }
    return checked(rows, 17);
  },
};
export default board;
