// pCLUE is CLUE's multi-task prompt-learning leaderboard for Chinese language models.
// The headline score is the site's n_score value, shown as a percentage.
// The importer reads the paged JSON returned by the site's POST API.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.cluebenchmarks.com/pclue.html';
const FEED = 'https://www.cluebenchmarks.com/api/pclue/';
const number = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value.replace(/<[^>]+>/g, '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};
interface Entry { model?: string; date?: string; team?: string; url?: string; n_score?: string; pclue_mrcf1?: string; pclue_mrcem?: string; pclue_classify?: string; pclue_nli?: string; pclue_generate?: string }
const board: Leaderboard = {
  benchmark: 'pclue', url: PAGE, feed: FEED,
  terms: 'CLUE publishes this ranking and its public API. Separate score reuse terms are not stated.',
  parts: {
    readingF1: { name: 'Reading comprehension F1', group: 'Task', note: 'F1 on the pCLUE reading comprehension tasks.' },
    readingEM: { name: 'Reading comprehension EM', group: 'Task', note: 'Exact match on the pCLUE reading comprehension tasks.' },
    classification: { name: 'Classification', group: 'Task' },
    inference: { name: 'Inference', group: 'Task' },
    generation: { name: 'Generation', group: 'Task' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (let page = 1; page <= 100; page++) {
      const data = await fetchJson<{ status?: number; total?: number; data?: Entry[] }>(FEED, { method: 'POST', body: new URLSearchParams({ page: String(page) }) });
      if (data.status !== 1 || !Array.isArray(data.data)) throw new Error(`pCLUE: invalid response on page ${page}`);
      for (const entry of data.data) {
        const score = number(entry.n_score);
        if (!entry.model || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries({ readingF1: entry.pclue_mrcf1, readingEM: entry.pclue_mrcem, classification: entry.pclue_classify, inference: entry.pclue_nli, generation: entry.pclue_generate })) {
          const parsed = number(value);
          if (parsed !== undefined) metrics[key] = parsed * 100;
        }
        rows.push({ model: entry.model, score: score * 100, date: entry.date?.slice(0, 10), submitter: entry.team, link: entry.url, metrics });
      }
      if (!data.data.length || (data.total !== undefined && rows.length >= data.total)) break;
    }
    if (rows.length < 5) throw new Error(`pCLUE: ${rows.length} rows, expected at least 5`);
    return rows;
  },
};
export default board;
