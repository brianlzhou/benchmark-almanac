// RelyToolBench measures reliable pass rate for tool calls. Table 2 reports three task groups and
// the overall result for each model and training method. Table 3 also gives the original pass rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
const feed = 'https://arxiv.org/html/2412.04141';
const board: Leaderboard = {
  benchmark: 'relytoolbench', static: 'paper', url: 'https://arxiv.org/abs/2412.04141', feed, terms: PAPER_TERMS,
  aliases: { 'Llama3.1 (8B)': 'llama-3-1-8b', 'Qwen2.5 (7B)': 'qwen2-5-7b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const figure = html.match(/<figure\b[^>]*id="S4.T2"[\s\S]*?<\/figure>/)?.[0];
    if (!figure || !['RePR','Tool','Hallu','Utility','Overall'].every(h => figure.includes(h))) throw new Error('Missing RelyToolBench headers');
    const data = figure.slice(figure.indexOf('ltx_colspan_17'));
    const labels = ['I1 Instruction','I2 Category','I3 Instruction','Overall'];
    board.parts = Object.fromEntries(labels.slice(0,3).map(k => [k,k]));
    const pass = tables.find(t => t[1]?.join('|') === 'Method|PR|RePR|PR|RePR|PR|RePR|PR|RePR');
    if (!pass) throw new Error('Missing original pass rate table');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const line of data.split(/<span\b[^>]*class="ltx_tr"[^>]*>/)) {
      if (line.includes('ltx_colspan_17')) {
        group = text(line.replace(/<cite\b[\s\S]*?<\/cite>/g, '')).replace(/^ltx_colspan_17[^>]*>/,'').trim();
        continue;
      }
      const cells = line.split(/<span\b[^>]*class="ltx_td\b[^"]*"[^>]*>/).slice(1).map(text);
      if (cells.length !== 17) throw new Error('Incomplete RelyToolBench row');
      const closed = group.includes('Closed-source');
      const model = closed ? cells[0] : group;
      const metrics: Record<string,number> = {};
      for (const [i, key] of labels.entries()) {
        const nums = cells.slice(1+4*i,5+4*i).map(x => numberCell(x.replace(/\s/g,'')));
        metrics[key] = nums[0];
        metrics[key + ' Tool Hallu'] = nums[1];
        metrics[key + ' Tool Num'] = nums[2];
        metrics[key + ' Utility'] = nums[3];
      }
      if (!closed && ['Baseline','+ Relign'].includes(cells[0])) {
        const name = group.split(' (')[0].toLowerCase();
        const base = pass.findIndex(r => r[0].toLowerCase() === name);
        if (base < 0) throw new Error('Missing pass rate for ' + group);
        const pr = pass[base + Number(cells[0] === '+ Relign')];
        labels.forEach((k,i) => {metrics[k+' PR'] = numberCell(pr[1+2*i]);});
      }
      rows.push({model: model === 'GPT 4o' ? model+' (snapshot unspecified)' : model, setting: closed ? undefined : cells[0], score: metrics.Overall, metrics});
    }
    if (rows.length < 24) throw new Error('Missing RelyToolBench runs');
    return rows;
  },
};
export default board;
