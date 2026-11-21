// Table 2 gives the two domain scores. The methods specify a trial minimum and an action limit.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2406.12045';
const board: Leaderboard = {
  benchmark: 'tau-bench', static: 'paper', parts: {
  retail: { name: 'Retail', group: 'Domain' },
  airline: { name: 'Airline', group: 'Domain' },
}, url: URL, feed: URL + ' (maker-published avg column)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.join('|') === 'Model|retail|airline|avg');
    if (!t || t.length < 4) throw new Error('tau-bench aggregate table missing');
    return t.slice(1).map(r => ({model: paperModel(r[0]), score: Number(r[3]), harness: r[0] === 'meta-llama-3-70B' ? 'text-ReAct' : 'tool-calling',
      setting: 'pass^1; domain-weighted average; at least 3 trials per task; GPT-4o user simulator; agent temperature 0; user temperature 1; max 30 actions', metrics: {minimumTrials: 3, maxActions: 30, agentTemperature: 0, userTemperature: 1, retail: Number(r[1]), airline: Number(r[2])}}));
  },
};
export default board;
