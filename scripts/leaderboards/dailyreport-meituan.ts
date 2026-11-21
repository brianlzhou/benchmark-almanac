// DailyReport tests search agents on open-ended research tasks. Table 3 scores reports
// by user preference on a 1 to 4 scale, with four additional evaluation rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2606.12871';
const board: Leaderboard = {
  benchmark: 'dailyreport-meituan', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  parts: {pass:{name:'SubTask Pass',unit:'%'},inst:{name:'InstFollow',unit:'%'},
    fact:{name:'Factuality',unit:'%'},rat:{name:'Rationality',unit:'%'}},
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|UserPref|SubTask Pass|InstFollow|Factuality|Rationality');
    if (!table) throw new Error('Missing DailyReport results');
    let group = '';
    const rows: LeaderboardRow[] = [];
    for (const [label, ...cells] of table.slice(1)) {
      if (cells.every(x => x === label)) { group = label; continue; }
      if (cells.length !== 5 || cells.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid DailyReport score');
      const model = label.replace(/ (?:OpenAI|Google|Team|xAI|Anthropic|DeepMind|GLM-5-Team) \(\d{4}[ab]?\)$/, '').replace(/^CC-/, '');
      const [score,pass,inst,fact,rat] = cells.map(Number);
      rows.push({model,score,...(group === 'LLMs with Claude Code' ? {harness:'Claude Code'} :
        group === 'LLMs with Search Tools' ? {setting:'Search tools'} : {}),
        metrics:{pass:100*pass,inst:100*inst,fact:100*fact,rat:100*rat}});
    }
    return checked(rows,17);
  },
};
export default board;
