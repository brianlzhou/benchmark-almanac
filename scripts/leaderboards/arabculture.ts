// ArabCulture tests commonsense reasoning about daily life in Arab countries. Tables 3 and 9 report
// zero-shot accuracy under English and Arabic prompts with three levels of location context.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2502.12788';
const board: Leaderboard = {
  benchmark: 'arabculture', static: 'paper', url: 'https://arxiv.org/abs/2502.12788', feed, terms: PAPER_TERMS,
  aliases: { 'Llama-3.1 Instruct (8B)':'llama-3-1-8b', 'Llama-3 Instruct (70B)':'llama-3-70b', 'Llama-3.3 Instruct (70B)':'llama-3-3-70b-instruct', 'Gemma-2 Instruct (9B)':'gemma-2-9b', 'Gemma-2 Instruct (27B)':'gemma-2-27b', 'Qwen2.5 Instruct (7B)':'qwen2-5-7b', 'Qwen2.5 Instruct (14B)':'qwen2-5-14b', 'Qwen2.5 Instruct (32B)':'qwen2-5-32b', 'Qwen2.5 Instruct (72B)':'qwen2-5-72b', 'QwQ (32B)':'qwq-32b-preview' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const main = tables.filter(t => t[0]?.join('|') === 'Model (#parameter)|Completion|Completion|Completion|MCQ|MCQ|MCQ');
    if (main.length !== 2) throw new Error('Missing English or Arabic prompt table');
    const rows: LeaderboardRow[] = [];
    const context = ['No location','Region','Region + Country'];
    board.parts = {};
    for (const [index,t] of main.entries()) {
      if (t.length < 38 || t[1].slice(1,4).join('|') !== '\\ell= None|\\ell= R|\\ell= R + C') throw new Error('ArabCulture prompt columns changed');
      const language = index === 0 ? 'English' : 'Arabic';
      for (const [raw,...values] of t.slice(2)) {
        if (['Human','Random'].includes(raw)) continue;
        const model = raw.startsWith('mT0 ') ? 'mT0 XXL (14B)' : raw;
        if (values.length !== 6) throw new Error('Incomplete ArabCulture row');
        values.forEach((v,i) => {
          if (['','–','-'].includes(v)) { if (model !== 'GPT-4o' || i >= 3) throw new Error('Missing ArabCulture accuracy'); return; }
          rows.push({model,setting:[language,t[0][i+1],context[i%3]].join(', '),score:numberCell(v)});
        });
      }
      const configs = index === 0 ? [['GPT-4o',2],['Qwen2.5 Instruct (72B)',0],['AceGPT-v2 Chat (32B)',0]] as const :
        [['GPT-4o',1],['AceGPT-v2 Chat (32B)',2],['Llama-3.3 Instruct (70B)',2]] as const;
      const details = tables.filter(d => d[0]?.[1] === 'GPT-4o' && d[0]?.[3] === (index === 0 ? 'Qwen-2.5' : 'AceGPT-v2'));
      if (details.length !== 2) throw new Error('Missing ArabCulture breakdowns');
      configs.forEach(([model,c],j) => {
        const row = rows.find(r => r.model === model && r.setting === [language,'MCQ',context[c]].join(', '));
        if (!row) throw new Error('Missing ArabCulture comparison model');
        row.metrics = {};
        for (const d of details) for (const r of d.slice(2)) for (const k of [0,1]) {
          const key = r[0]+(k === 0 ? ' (CS)' : ' (non-CS)');
          board.parts![key] = key;
          row.metrics[key] = numberCell(r[1+2*j+k]);
        }
      });
    }
    if (rows.length < 402) throw new Error('Missing ArabCulture configurations');
    for (const row of rows) {
      if (row.model === 'GPT-4o') row.model += ' (snapshot unspecified)';
      if (/^(?:Llama-3.1|Gemma-2|Qwen2.5)(?: Instruct)? \(/.test(row.model)) {
        row.setting += row.model.includes('Instruct') ? ', instruct' : ', base';
      }
    }
    return rows;
  },
};
export default board;
