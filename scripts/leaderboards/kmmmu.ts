// KMMMU tests Korean multimodal exam questions. Table 3 averages accuracy over nine disciplines and gives standard deviations over three runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2604.13058';

const board: Leaderboard = {
  benchmark: 'kmmmu', static: 'paper',
  url: 'https://arxiv.org/abs/2604.13058',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Qwen3-VL-2B-IT": "qwen3-vl-2b-instruct", "Qwen3-VL-4B-IT": "qwen3-vl-4b-instruct", "Qwen3-VL-8B-IT": "qwen3-vl-8b-instruct", "Qwen3-VL-30B-A3B-IT": "qwen3-vl-30b-a3b-instruct", "Qwen3-VL-32B-IT": "qwen3-vl-32b-instruct", "Qwen3-VL-235B-A22B-IT": "qwen3-vl-235b-a22b-instruct"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const t = tables.find(t => t[0]?.at(-1) === 'Overall Acc.' && t[1]?.[0] === 'Open-Weight Multilingual Non-Reasoning Models');
    if (!t || t.length < 21 || t[0].length !== 11) throw new Error('Missing full KMMMU comparison');
    board.parts = {};
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const c of t.slice(1)) {
      if (c.every(x => x === c[0])) { group = c[0]; continue; }
      const metrics: Record<string, number> = {};
      for (let i=1; i<t[0].length; i++) {
        const m = c[i].match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
        if (!m) throw new Error('Invalid KMMMU accuracy');
        const key = i === 10 ? 'overall' : t[0][i];
        if (i < 10) board.parts[key] = key;
        metrics[key] = Number(m[1]);
        metrics[key+'Sd'] = Number(m[2]);
      }
      const score = metrics.overall;
      delete metrics.overall;
      rows.push({ model: c[0], score, open: true, trials: 3, setting: /non-reasoning/i.test(group) ? 'Non-Reasoning' : 'Reasoning', metrics });
    }
    if (rows.length < 17) throw new Error('Incomplete KMMMU comparison');
    return rows;
  },
};
export default board;
