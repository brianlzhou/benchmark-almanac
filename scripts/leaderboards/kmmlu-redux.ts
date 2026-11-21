// KMMLU-Redux measures accuracy on corrected Korean qualification exams. Table 8 lists the
// whole-test average and 14 domain accuracies. Table 3 compares English and Korean prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import kmmluPro from './kmmlu-pro.ts';

const feed = 'https://arxiv.org/html/2507.08924';
const board: Leaderboard = {
  benchmark: 'kmmlu-redux', static: 'paper', url: 'https://arxiv.org/abs/2507.08924', feed, terms: PAPER_TERMS,
  // Tables 2 and 7 disambiguate two typographical errors in Table 8.
  aliases: { ...kmmluPro.aliases, 'GPT-4.1 mini (2024-04-14)': 'gpt-4-1-mini' },
  async fetch() {
    const tables = flatPaperTables((await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const detail = tables.find(t => t[0]?.[2] === 'Safety Management' && t[0]?.at(-1) === 'Avg.');
    const prompts = tables.find(t => t[0]?.[1] === 'KMMLU-Redux' && t[1]?.slice(1, 4).join('|') === 'English|Korean|diff (%)');
    if (!detail || !prompts || detail[0].length !== 17) throw new Error('Missing KMMLU-Redux results');
    const domains = detail[0].slice(2, -1);
    board.parts = Object.fromEntries(domains.map(key => [key, key]));
    const rows: LeaderboardRow[] = [];
    const english = new Set<string>();
    let open = true;
    for (const r of detail.slice(1)) {
      if (r.every(c => c === r[0])) { open = r[0] !== 'Closed Models'; continue; }
      if (r.length !== 17) throw new Error('Incomplete KMMLU-Redux domain row');
      const name = r[1];
      const model = name.replace(/\s*\(w\/ thinking\)/, '').replace(/\s*\(\d+(?:\.\d+)?B\)/, '').trim();
      const score = numberCell(r[16].replace(/\s*⋆$/, ''));
      const metrics = Object.fromEntries(domains.map((k, i) => [k, numberCell(r[i + 2])]));
      const comparison = prompts.find(p => p[0] === name);
      const mode = name.includes('(w/ thinking)') ? ', thinking' : '';
      rows.push({ model, score, metrics, open, setting: (comparison ? 'English prompt' : 'Paper default prompt') + mode +
        (r[16].includes('⋆') ? ', model used for dataset filtration' : '') });
      if (comparison) {
        if (score !== numberCell(comparison[1])) throw new Error('KMMLU-Redux prompt scores disagree');
        english.add(name);
        rows.push({ model, open, setting: 'Korean prompt' + mode, score: numberCell(comparison[2]) });
      }
    }
    for (const r of prompts.slice(2).filter(r => !english.has(r[0]))) {
      rows.push({ model: r[0], setting: 'English prompt', score: numberCell(r[1]) },
        { model: r[0], setting: 'Korean prompt', score: numberCell(r[2]) });
    }
    if (rows.length < 60) throw new Error('Missing KMMLU-Redux model configurations');
    return rows;
  },
};
export default board;
