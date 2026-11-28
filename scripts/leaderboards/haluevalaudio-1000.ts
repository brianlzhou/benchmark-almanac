// HaluEvalAudio 1000 tests answers to spoken factual questions.
// Table 1 of the dataset's cited paper gives HaluEval response accuracy. RAG rows also report reference correctness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2604.12928';
const board: Leaderboard = {
  benchmark: 'haluevalaudio-1000', static: 'paper', url: feed, feed,
  terms: 'The authors list the paper license at https://arxiv.org/abs/2604.12928.',
  stats: {
    reference: { name: 'Retrieved reference correctness', unit: '%', better: 'higher' },
    ttfat: { name: 'Time to first audio token', unit: 'seconds', better: 'lower' },
    kd: { name: 'Knowledge delay', unit: 'seconds', better: 'lower' },
    e2ekd: { name: 'End-to-end knowledge delay', unit: 'seconds', better: 'lower' },
  },
  aliases: { 'GLM-4-Voice': 'glm-4-voice-9b', 'Qwen 2.5 Omni': 'qwen2-5-omni-7b',
    'Qwen3-Omni-A3B-Ins.': 'qwen3-omni-30b-a3b', 'Vanilla Moshi': 'moshi', 'Kimi-Audio': 'kimi-audio-7b-instruct',
    'Baichuan-Audio': 'baichuan-audio-instruct' },
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[1]?.[4] === 'HaluEval' && t[2]?.[4]?.includes('resp.'));
    if (!table) throw new Error('Missing HaluEval response accuracy column');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(3)) {
      if (cells[0].startsWith('∗') || cells[4] === '-') continue;
      const size = cells[0].match(/\((\d+)B\)/);
      const name = cells[0].split(' (')[0].trim();
      const row: LeaderboardRow = { model: name, score: 0, params: size ? Number(size[1]) : undefined };
      const metrics: Record<string, number> = {};
      const rag = name.match(/^MoshiRAG \{\}_\{(.+)\}$/);
      if (rag) {
        const [reference, response] = cells[4].split('|').map(numberCell);
        if (response === undefined) throw new Error('Missing response accuracy');
        row.model = 'MoshiRAG';
        row.setting = rag[1] + ' retrieval back end';
        metrics.reference = reference;
        row.score = response;
      } else row.score = numberCell(cells[4]);
      for (const [idx, key] of [[5, 'ttfat'], [6, 'kd'], [7, 'e2ekd']] as const) {
        const raw = cells[idx]?.trim() ?? '';
        if (/^-?\d+(?:\.\d+)?$/.test(raw)) metrics[key] = Number(raw);
      }
      if (Object.keys(metrics).length) row.metrics = metrics;
      rows.push(row);
    }
    return checked(rows, 14);
  },
};
export default board;
