import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2411.04368';
const board: Leaderboard = {
  benchmark: 'simpleqa-hallucination-rate', url: URL, feed: URL + ' (Incorrect column; lower is better)', terms: PAPER_TERMS,
  aliases: {'Claude-3.5-sonnet (2024-06-20)': 'claude-3-5-sonnet', 'Claude-3-haiku (2024-03-07)': 'claude-3-haiku', 'Claude-3-sonnet (2024-02-29)': 'claude-3-sonnet', 'Claude-3-opus (2024-02-29)': 'claude-3-opus', 'GPT-4o-mini (snapshot unspecified)': 'gpt-4o-mini'},
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[3] === 'Incorrect');
    if (!t || t.length < 4) throw new Error('SimpleQA incorrect-rate table missing');
    return t.slice(1).map(r => ({model: paperModel(r[0].replace(/^OpenAI /, '')), score: Number(r[3]),
      metrics: Object.fromEntries([1,2,4,5].map(i => [t[0][i], Number(r[i])]))}));
  },
};
export default board;
