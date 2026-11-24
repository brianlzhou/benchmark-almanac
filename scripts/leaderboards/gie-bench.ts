// GIE-Bench measures whether an image edit follows an instruction and preserves unrelated regions.
// Table 2 reports overall correctness as a percentage. Table 3 gives five image preservation metrics.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
const url = 'https://arxiv.org/html/2505.11493';
const parts = ['Add Object','Attribute Change','Color Change','Layout Modif.','Object Replace',
  'Remove Object','Scene / Bkgd Change','Size Change','Textual Edit'];
const preservation = ['SSIM','CLIP','Unmasked CLIP','PSNR','MSE'];
const board: Leaderboard = {
  benchmark:'gie-bench',static:'paper',url,feed:url,
  terms:'The authors publish the tables under the license linked at https://arxiv.org/abs/2505.11493.',
  parts:Object.fromEntries(parts.map(name => [name,{name,unit:'%'}])),
  stats:Object.fromEntries(preservation.map(name => [name,{name,unit:'score',better:name === 'MSE' ? 'lower' as const : 'higher' as const}])),
  async fetch() {
    const html = await paperHtml(url);
    const figure = html.match(/<figure id="S4\.T2"[^>]*>([\s\S]*?)<figcaption/);
    const header = ['Model',...parts,'Overall'].join(' ');
    const data = figure && text(figure[1]);
    const table = paperTables(html).map(grid).find(t => t[0]?.map(h=>h.split('\\')[0]).join('|') === ['Model',...preservation].join('|'));
    if (!data?.startsWith(header+' ') || !table) throw new Error('Missing correctness or preservation columns');
    const tokens = data.slice(header.length).trim().split(/\s+/);
    if (tokens.length % 11) throw new Error('Table 2 width changed');
    const rows = [];
    for (let i=0;i<tokens.length;i+=11) {
      const model = tokens[i].replace(/\*$/,'');
      const row = table.find(r=>r[0] === model);
      if (!row) throw new Error('Missing preservation metrics for '+model);
      const metrics = Object.fromEntries([...parts.map((p,j)=>[p,numberCell(tokens[i+1+j])]),
        ...preservation.map((p,j)=>[p,numberCell(row[j+1])])]);
      rows.push({model,metrics,score:numberCell(tokens[i+10]),
        setting:tokens[i].endsWith('*') ? 'Gemini-2-flash judge' : 'GPT-4o judge'});
    }
    return checked(rows,11);
  },
};
export default board;
