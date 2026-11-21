// The source reports no overall score across edit types. The headline is the plain mean of the two parts, computed by this importer.
// MMArt-Bench tests scene-level and region-level photo edits. For each type, the paper defines O as
// the geometric mean of semantic consistency and perceptual quality. Tables 1 and 4 use different judges.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2506.17612';
const measures = ['L1','L2','SC','PQ','O'];
const parts: Record<string,BoardPart> = {};
const groups = ['Scene-level','Region-level'];
for (const group of groups) for (const name of measures) {
  const loss = name === 'L1' || name === 'L2';
  parts[group + name] = {name,group,unit:'score',better:loss ? 'lower' : 'higher',
    note:name === 'L1' ? 'L1 times 100.' : name === 'L2' ? 'L2 times 1,000.' : undefined};
}
const board: Leaderboard = {
  benchmark:'mmart-bench', static:'paper', url, feed:url, terms:PAPER_TERMS, parts,
  headline:'The headline averages the overall VIEScores for scene-level and region-level edits.',
  async fetch() {
    const html = await paperHtml(url);
    const rows = [];
    for (const fig of html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)) {
      const cap = fig[1].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] || '';
      if (!cap.includes('Quantitative evaluation on MMArt-Bench')) continue;
      const judge = cap.includes('Gemini-2-Flash') ? 'Gemini-2-Flash' : cap.includes('Qwen2.5-VL-72B') ? 'Qwen2.5-VL-72B' : '';
      const table = flatPaperTables(fig[1]).map(grid).find(t => t[0][2] === groups[0] && t[0][7] === groups[1]);
      if (!judge || !table || !measures.every((m,i) => table[1][i+2]?.startsWith(m) && table[1][i+7]?.startsWith(m))) throw new Error('Missing MMArt-Bench metrics or judge');
      for (const row of table.slice(2)) {
        if (row[1] === '✗' && row[6] === '-' && row[11] === '-') continue;
        const metrics: Record<string,number> = {};
        groups.forEach((g,j) => measures.forEach((m,i) => { metrics[g+m] = numberCell(row[2+j*5+i]); }));
        const model = row[0].startsWith('Gemini-2-Flash') ? 'Gemini-2-Flash (image editing, snapshot unspecified)' : row[0];
        rows.push({model,setting:judge + ' judge',score:(metrics['Scene-levelO'] + metrics['Region-levelO'])/2,metrics});
      }
    }
    return checked(rows,16);
  },
};
export default board;
