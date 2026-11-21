// MSEarth measures multiple-choice accuracy on figures from Earth science papers. Tables 4 and 11 give overall accuracy with and without the original caption.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2505.20740';

const board: Leaderboard = {
  benchmark: 'msearth', static: 'paper',
  url: 'https://arxiv.org/abs/2505.20740',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"LLaVA-onvision-72B": "llava-onevision-72b", "Llama3.2-90B-Vision": "llama-3-2-90b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const comparisons = tables.filter(t => t[0]?.[0] === 'Model' && t[1]?.at(-1) === 'ACC' && t[1].includes('Cross'));
    if (comparisons.length !== 2) throw new Error('Missing MSEarth comparisons');
    const results = new Map<string, LeaderboardRow>();
    board.parts = {};
    for (const t of comparisons) {
      const oc = t[1].indexOf('OC'), start = t[1].indexOf('Single');
      if (t[1].slice(start).join('|') !== 'Single|Multi|Cross|reasoning|Percept|ACC') throw new Error('Changed MSEarth columns');
      for (const c of t.slice(2)) {
        if (c.every(v => v === c[0])) continue;
        const model = c[0];
        const caption = oc < 0 || c[oc] === '✓' ? 'With original caption' : 'Without original caption';
        const setting = model.endsWith('-Thinking') ? caption + ', Thinking' : caption;
        if (oc >= 0 && !['✓','✗'].includes(c[oc])) throw new Error('Unexpected caption setting');
        if (c.slice(start).some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid MSEarth accuracy');
        const metrics: Record<string, number> = {};
        for (let j = start; j < t[1].length-1; j++) {
          board.parts[t[1][j]] = { name: t[1][j], group: t[0][j] };
          metrics[t[1][j]] = Number(c[j]);
        }
        const key = JSON.stringify([model, setting]), score = Number(c.at(-1));
        if (results.has(key) && results.get(key)!.score !== score) throw new Error('Conflicting MSEarth score');
        results.set(key, { model, setting, score, metrics });
      }
    }
    if (results.size < 33) throw new Error('Incomplete MSEarth comparison');
    return [...results.values()];
  },
};
export default board;
