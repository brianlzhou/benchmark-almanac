// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// NoLiMa-Hard tests long-context retrieval without literal matches. Its README gives accuracy at 4K to 32K.
// Base Score is a separate short-context reference and does not enter the mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/adobe-research/NoLiMa/HEAD/README.md';
const parts = { ctx4k: '4K', ctx8k: '8K', ctx16k: '16K', ctx32k: '32K' };
const board: Leaderboard = {
  benchmark: 'nolima-hard', url: 'https://github.com/adobe-research/NoLiMa#nolima-hard-results', feed,
  terms: 'Adobe Research License. https://github.com/adobe-research/NoLiMa/blob/main/LICENSE',
  headline: 'Plain mean of accuracy at 4K, 8K, 16K, and 32K context lengths.', parts,
  aliases: { 'GPT-o3': 'o3', 'GPT-o1': 'o1', 'GPT-o4 Mini': 'o4-mini', 'GPT-o3 Mini': 'o3-mini',
    'GPT-4o': 'gpt-4o-nov-2024', 'Llama 3.3 70B': 'llama-3-3-70b-instruct', 'Gemini 2.5 Flash': 'gemini-2-5-flash-may-2025' },
  async fetch() {
    const table = (await fetchText(feed)).split('### NoLiMa-Hard Results')[1]?.trim().split('\n\n')[0];
    if (!table || !/Models\s*\|\s*Base Score\s*\|\s*4K\s*\|\s*8K\s*\|\s*16K\s*\|\s*32K/.test(table)) throw new Error('Missing Hard results');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const line of table.split('\n').slice(2)) {
      let [model, ...cells] = line.trim().slice(1, -1).split('|').map(v => v.replace(/[*🆕]/gu, '').trim());
      if (cells.every(v => !v)) { group = model; continue; }
      let setting = group.startsWith('Baselines') ? 'Without chain of thought' : undefined;
      if (model.startsWith('- ')) { setting = model.includes('w/o') ? 'Without chain of thought' : 'Chain of thought'; model = group; }
      const thinking = model.match(/^(.+) \(w(\/o|\/) Thinking\)$/);
      if (thinking) { model = thinking[1]; setting = thinking[2] === '/o' ? 'Thinking off' : 'Thinking on'; }
      if (cells.length !== 5 || cells.some(v => !/^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid context-length score');
      const [baseScore, ctx4k, ctx8k, ctx16k, ctx32k] = cells.map(Number);
      rows.push({ model, setting, score: (ctx4k + ctx8k + ctx16k + ctx32k) / 4, metrics: { baseScore, ctx4k, ctx8k, ctx16k, ctx32k } });
    }
    // The repository identifies GPT-4o's exact November snapshot in its model configuration.
    return checked(rows, 12).map(r => r.model === 'GPT-4o (snapshot unspecified)' ? { ...r, model: 'GPT-4o' } : r);
  },
};
export default board;
