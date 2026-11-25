// CoRe-Bench tests reasoning about multi-speaker conversations. AHELM reports prefix
// quasi-exact match (PEM) on the entire scenario. We convert fractions to percentages.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { HELM_ALIASES, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';
const table: HelmTable = {project:'audio',kind:'runs',group:'corebench',column:'PEM',scale:100};
const board: Leaderboard = {
  benchmark:'corebench-conversational-reasoning', host:'AHELM',url:'https://crfm.stanford.edu/helm/audio/latest/#/groups/corebench',feed:helmFeed(table),
  terms:'The Stanford HELM project publishes the results under the terms at https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  aliases:{...HELM_ALIASES,'gemini-2.5-pro-preview-05-06':'gemini-2-5-pro-may-2025','gemini-2.5-flash-preview-05-20':'gemini-2-5-flash-may-2025',
    'gemini-1.5-pro-001':'gemini-1-5-pro-may-2024','gemini-1.5-flash-001':'gemini-1-5-flash-may-2024','gemini-1.5-pro-002':'gemini-1-5-pro-sept-2024',
    'gemini-1.5-flash-002':'gemini-1-5-flash-sep-2024','gemini-2.0-flash-exp':'gemini-2-0-flash-dec-2024','gemini-2.0-flash-001':'gemini-2-0-flash-feb-2025',
    'gpt-4o-2024-11-20':'gpt-4o-nov-2024'},
  stats:{
    inputTokens:{name:'Input tokens per request',unit:'tokens'},
  },
  async fetch() {
    const rows = await helmRows(table,true);
    for (const row of rows) {
      const blend = /^(whisper-1|gpt-4o(?:-mini)?-transcribe)_(gpt-4o-2024-11-20)$/.exec(row.model);
      if (blend) {
        row.model=blend[2]; row.models=[blend[2],blend[1]]; row.harness=blend[1]+' transcription';
      }
      if (row.metrics) {
        if ('# prompt tokens' in row.metrics) row.metrics.inputTokens = row.metrics['# prompt tokens'];
        delete row.metrics['# prompt tokens'];
        delete row.metrics['# output tokens'];
        delete row.metrics.truncated;
      }
    }
    return checked(rows,17);
  },
};
export default board;
