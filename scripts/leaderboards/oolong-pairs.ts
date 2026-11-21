// OOLONG-Pairs tests long-context pair identification and reports F1.
// This importer reads the OOLONG-Pairs row in Prime Intellect's public comparison table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const PAGE = 'https://www.primeintellect.ai/blog/prime-agent';
const board: Leaderboard = {
  benchmark: 'oolong-pairs', url: PAGE, feed: PAGE,
  terms: 'Prime Intellect publishes the comparison table in its public research article. https://www.primeintellect.ai/blog/prime-agent',
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(PAGE)).find((rows) => rows.some((row) => row.some((cell) => cell.text.includes('OOLONG-Pairs'))));
    if (!table) throw new Error('OOLONG-Pairs comparison table missing');
    const header = table.find((cells) => cells[0]?.text.trim() === 'Eval')?.map((cell) => cell.text.trim()) ?? [];
    const row = table.find((cells) => cells[0]?.text.includes('OOLONG-Pairs'));
    if (!row || row.length < 7) throw new Error('OOLONG-Pairs row missing');
    const models = ['GLM-5.2', 'GLM-5.2', 'Opus 5', 'Opus 5', 'GPT-5.6 Sol', 'GPT-5.6 Sol'];
    const harnesses = ['Prime-Agent', 'Pi-mono (w/ sub-agents)', 'Prime-Agent', 'Claude Code', 'Prime-Agent', 'Codex'];
    const rows = row.slice(1, 7).map((cell, index) => ({ model: models[index], harness: harnesses[index], setting: 'high', score: Number(cell.text.trim()) * 100 }));
    if (header.length < 7 || rows.some((item) => !Number.isFinite(item.score))) throw new Error('OOLONG-Pairs score columns missing');
    return rows;
  },
};
export default board;
