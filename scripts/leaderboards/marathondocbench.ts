// MarathonDocBench measures end-to-end parsing of long documents. Table 2 reports the Overall
// score alongside eight component measures. The three edit distances are lower-is-better fractions.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.39308';
const board: Leaderboard = {
  benchmark:'marathondocbench', static: 'paper',url:'https://arxiv.org/abs/2610.39308',feed,terms:PAPER_TERMS,
  aliases: { 'DeepSeek-4.1-Flash': 'deepseek-v4-1-flash' },
  async fetch() {
    const html = await paperHtml(feed);
    const figure = html.match(/<figure\b[^>]*id="S5.T2"[\s\S]*?<\/figure>/)?.[0];
    if (!figure?.includes('MarathonDocBench')) throw new Error('Missing MarathonDocBench comparison');
    const t = flatPaperTables(figure.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi,'')).map(grid).find(t => t[0]?.[1] === 'Overall\\uparrow');
    if (!t || t[0].length !== 10) throw new Error('Unexpected MarathonDocBench columns');
    const parts:Record<string,BoardPart> = {};
    for (const header of t[0].slice(2)) {
      const m = header.match(/^(.+)\{\}\^\{(.+)\}\\(up|down)arrow$/);
      if (!m) throw new Error('Unknown MarathonDocBench column '+header);
      const name = m[1]+' ('+m[2]+')';
      parts[name] = {name,unit:m[3] === 'down' ? 'score' : '%',better:m[3] === 'down' ? 'lower' : 'higher',...(m[3] === 'down' ? {note:'Normalized edit distance from 0 to 1'} : {})};
    }
    board.parts = parts;
    const rows = t.slice(1).filter(r => !r.every(v => v === r[0])).map(([model,overall,...values]) => {
      if (values.length !== 8) throw new Error('Incomplete MarathonDocBench row');
      return {model:model.replace(' (Ours)',''),score:numberCell(overall),metrics:Object.fromEntries(Object.keys(parts).map((k,i) => [k,numberCell(values[i])]))};
    });
    if (rows.length < 9) throw new Error('Missing MarathonDocBench models');
    return rows;
  },
};
export default board;
