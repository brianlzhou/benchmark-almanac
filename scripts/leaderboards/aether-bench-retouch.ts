// Aether-Bench evaluates automatic, style-guided, and parameter-guided photo retouching.
// Table 2 starts with Auto Hist-M, the percentage histogram consistency score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2604.27375';
const aetherParts: Leaderboard['parts'] = {
  autoHistM: { name: 'Hist-M', group: 'Auto', unit: '%', better: 'higher' },
  autoLAION: { name: 'LAION', group: 'Auto', unit: 'score', better: 'higher' },
  autoQAlign: { name: 'Q-Align', group: 'Auto', unit: 'score', better: 'higher' },
  autoLIQE: { name: 'LIQE', group: 'Auto', unit: 'score', better: 'higher' },
  autoDISTS: { name: 'DISTS', group: 'Auto', unit: 'score', better: 'lower' },
  autoGMSD: { name: 'GMSD', group: 'Auto', unit: 'score', better: 'lower' },
  autoTD: { name: 'TD', group: 'Auto', unit: 'score', better: 'lower' },
  styleL1: { name: 'L1', group: 'Style', unit: 'score', better: 'lower' },
  stylePSNR: { name: 'PSNR', group: 'Style', unit: 'score', better: 'higher' },
  styleSSIM: { name: 'SSIM', group: 'Style', unit: 'score', better: 'higher' },
  styleLPIPS: { name: 'LPIPS', group: 'Style', unit: 'score', better: 'lower' },
  styleDISTS: { name: 'DISTS', group: 'Style', unit: 'score', better: 'lower' },
  styleGMSD: { name: 'GMSD', group: 'Style', unit: 'score', better: 'lower' },
  styleTD: { name: 'TD', group: 'Style', unit: 'score', better: 'lower' },
  paramL1: { name: 'L1', group: 'Param', unit: 'score', better: 'lower' },
  paramPSNR: { name: 'PSNR', group: 'Param', unit: 'score', better: 'higher' },
  paramSSIM: { name: 'SSIM', group: 'Param', unit: 'score', better: 'higher' },
  paramLPIPS: { name: 'LPIPS', group: 'Param', unit: 'score', better: 'lower' },
  paramDISTS: { name: 'DISTS', group: 'Param', unit: 'score', better: 'lower' },
  paramGMSD: { name: 'GMSD', group: 'Param', unit: 'score', better: 'lower' },
  paramTD: { name: 'TD', group: 'Param', unit: 'score', better: 'lower' },
};
const board: Leaderboard = {
  benchmark: 'aether-bench-retouch', static: 'paper', url: feed, feed, parts: aetherParts,
  terms: 'The authors publish Table 2 on arXiv. https://arxiv.org/abs/2604.27375',
  aliases: {'Qwen-Image-2509': 'qwen-image-edit-2509'},
  headline: 'The paper reports separate metrics for three tasks. The headline is Auto Hist-M, the first metric.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[0] === 'Aether-Bench (Auto)');
    if (!table || !table[2][2].startsWith('Hist-M')) throw new Error('Missing Auto Hist-M');
    const rows = new Map<string, LeaderboardRow>();
    for (const group of ['Auto', 'Style', 'Param']) {
      const start = table.findIndex(c => c[0] === 'Aether-Bench (' + group + ')');
      if (start < 0) throw new Error('Missing Aether-Bench task: ' + group);
      const headers = table[start+1].slice(2);
      for (const cells of table.slice(start+2)) {
        if (cells[0].startsWith('Aether-Bench (')) break;
        const model = cells[0].replace(/^Ours-/, 'VeraRetouch-');
        const row: LeaderboardRow = rows.get(model) ?? {model,score:NaN,metrics:{}};
        headers.forEach((header,i) => {
          const name = header.split('\\')[0].replace('L_{1}','L1');
          const key = group.toLowerCase() + name.replace(/[^a-zA-Z0-9]/g,'');
          const value = numberCell(cells[i+2].replace('%',''));
          row.metrics![key] = value;
          if (key === 'autoHistM') row.score = value;
        });
        rows.set(model,row);
      }
    }
    return checked([...rows.values()],8);
  },
};
export default board;
