// CLBench-V tests how models use multimodal context for grounding, information use and knowledge acquisition.
// Table 2 weights completed subsets by instance count. Table 3 gives scores for all fourteen subdatasets.
import type { BoardPart, Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2607.25294';
const datasets = ['Insight-O3','ReasonMap-Short','ReasonMap-Long','ReasonMap-Plus','ZeroBench','CourtSI','MIRBench','Pix2Fact','MMLongBench-Pic','BrowseComp-V3','Financial Report ROE','PRISMM-Bench','CL-Bench-Table','Paper Conclusion'];
const parts: Record<string, BoardPart> = {};
const percent = (c: string) => Number((numberCell(c) * 100).toFixed(4));
const board: Leaderboard = {
  benchmark: 'clbench-v', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the results through arXiv. https://arxiv.org/abs/2607.25294',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const total = tables.find(t=>t[1]?.join('|') === 'Model|Overall|L0 Grounding|L1 Information|L2 Knowledge');
    const byDataset = tables.find(t=>t[1]?.join('|') === 'Model|O3|RMap-S|RMap-L|RMap+|ZB|CourtSI|MIR|Pix2Fact|MML-Pic|Browse|Finance|PRISMM|CL|Paper');
    if (!total || !byDataset) throw new Error('Missing aggregate or dataset results');
    return checked(total.slice(2).map(([model, score, ...levels]) => {
      const row = byDataset.slice(2).find(r=>r[0] === model);
      if (!row || row.length !== 15) throw new Error('Missing dataset results for ' + model);
      const metrics: Record<string,number> = {};
      for (const [i, value] of levels.entries()) {
        const key = 'level' + i;
        parts[key] = {name: total[1][i+2], group: 'Capability level'};
        metrics[key] = percent(value);
      }
      datasets.forEach((name,i) => {
        const key = byDataset[1][i+1].replace('+','Plus').replaceAll('-','');
        parts[key] = {name, group:'Subdataset'};
        metrics[key] = percent(row[i+1]);
      });
      return { model, score: percent(score), setting: 'Qwen3.6-27B judge for semantic evaluation', metrics };
    }), 6);
  },
};
export default board;
