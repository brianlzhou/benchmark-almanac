// The ScanNet++ iPhone novel view synthesis board ranks methods by color-corrected PSNR across all 12 test scenes.
// Its server-rendered results table also reports raw-image scores and whether each method uses iPhone depth.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://kaldir.vc.in.tum.de/scannetpp/benchmark/nvs_iphone";

const columns = ['Methods','iPhone Depth','PSNR (RAW)','SSIM (RAW)','LPIPS (RAW)','PSNR (CC)','SSIM (CC)','LPIPS (CC)'];

const board: Leaderboard = {
  benchmark: "scannet-plus-plus-v2",
  url: "https://kaldir.vc.in.tum.de/scannetpp/benchmark/nvs_iphone",
  feed: FEED,
  terms: "The dataset agreement limits data use to noncommercial research. It does not separately license leaderboard scores. https://kaldir.vc.in.tum.de/scannetpp/static/scannetpp-terms-of-use.pdf https://kaldir.vc.in.tum.de/scannetpp/benchmark/nvs_iphone",
  async fetch() {
    const table = tables((await fetchText(FEED)).replace(/<!--[\s\S]*?-->/g,'')).find(t => t[0]?.[0]?.text === 'Methods');
    if (!table || table[0].map(c=>c.text).join('|') !== columns.join('|') || !table[0][5].html.replace(/<!--[\s\S]*?-->/g,'').includes('bi-sort-down')) throw new Error('Unexpected ScanNet++ columns or default ranking');
    const runs = table.slice(1).filter(r => !(r.length === 1 && r[0].attrs.colspan === '8'));
    if (runs.length < 7) throw new Error('Incomplete ScanNet++ iPhone results');
    return runs.map((cells): LeaderboardRow => {
      const model = cells[0].text, path = cells[0].html.match(/href="([^"]+)"/)?.[1];
      if (!model || !path || cells.length !== columns.length) throw new Error('Missing ScanNet++ submission');
      const metrics: Record<string,number> = {};
      for (let i=2; i<columns.length; i++) {
        const value = cells[i].text;
        if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid '+columns[i]+' for '+model);
        metrics[columns[i]] = Number(value);
      }
      const depth = cells[1].html;
      if (!/bi-(check|x)-circle/.test(depth)) throw new Error('Missing iPhone depth flag');
      return {model, setting: depth.includes('bi-check') ? 'With iPhone depth' : 'Without iPhone depth', score: metrics['PSNR (CC)'], metrics, link: new URL(path,FEED).href};
    });
  },
};
export default board;
