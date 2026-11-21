// NarrativeQA tests whether models answer questions about stories. HELM Lite reports answer F1
// on a 0 to 1 scale in its NarrativeQA scenario table.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { helmFeed, helmRows, HELM_ALIASES, type HelmTable } from './helm-capabilities.ts';

const table: HelmTable = {project: 'lite', group: 'narrative_qa', column: 'F1'};
const board: Leaderboard = {
  benchmark: 'narrativeqa', host: 'HELM Lite', url: 'https://crfm.stanford.edu/helm/lite/latest/#/groups/narrative_qa',
  feed: helmFeed(table), aliases: HELM_ALIASES,
  terms: 'Stanford publishes HELM under the license at https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  stats: { 'Observed inference time (s)': { name: 'Observed inference time', unit: 'seconds', better: 'lower' }, '# eval': { name: 'Evaluation examples', unit: 'count' }, '# train': { name: 'Training examples', unit: 'count' }, '# prompt tokens': { name: 'Prompt tokens', unit: 'tokens' }, '# output tokens': { name: 'Output tokens', unit: 'tokens' }, inputTokens: { name: 'Input tokens', unit: 'tokens' }, outputTokens: { name: 'Output tokens copied to row', unit: 'tokens' } },
  async fetch() {
    const rows = await helmRows(table, true);
    for (const row of rows) {
      const metrics = row.metrics!;
      metrics.inputTokens = metrics['# prompt tokens'];
      metrics.outputTokens = metrics['# output tokens'];
      row.tokens = metrics.outputTokens;
    }
    return checked(rows, 91);
  },
};
export default board;
